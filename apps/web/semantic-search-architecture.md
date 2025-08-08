# Semantic Search Architecture for WriteItOut

## Executive Summary

This document outlines the implementation of semantic search capabilities for WriteItOut's transcription platform. By leveraging embeddings and vector databases, we can provide users with intelligent search that understands context and meaning, going beyond simple keyword matching.

**Key Benefits:**
- Find conceptually related content (e.g., "budget" matches "financial planning", "cost allocation")
- Handle transcription errors and variations in speech
- Enable natural language queries
- Provide more relevant results with timestamp navigation
- Support multi-language search capabilities

## Architecture Overview

### High-Level Data Flow

```
Transcript Input
    ↓
Chunking & Processing
    ↓
Embedding Generation
    ↓
Vector Database Storage
    ↓
User Search Query
    ↓
Query Embedding
    ↓
Similarity Search
    ↓
Ranked Results + Timestamps
```

### System Components

1. **Transcript Processor**: Chunks transcripts into searchable segments
2. **Embedding Service**: Converts text to vector representations
3. **Vector Database**: Stores and indexes embeddings for fast similarity search
4. **Search API**: Handles query processing and result ranking
5. **Frontend Integration**: Updated UI with semantic search capabilities

## Technical Implementation

### 1. Embedding Models

#### Option A: OpenAI Embeddings (Recommended)
```typescript
// Using OpenAI text-embedding-3-small
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: transcriptChunk,
  encoding_format: "float"
});
```

**Pros:**
- High quality, well-tested
- 1536 dimensions
- Cost-effective (~$0.02 per 1M tokens)
- Easy integration

**Cons:**
- External API dependency
- Data privacy considerations

#### Option B: Self-Hosted Sentence Transformers
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(transcript_chunks)
```

**Pros:**
- Complete data control
- No API costs after setup
- Customizable models

**Cons:**
- Infrastructure management
- Lower quality than OpenAI
- GPU requirements for performance

### 2. Vector Database Options

#### Option A: Pinecone (Managed Service)
```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pc.index("transcript-search");

// Store embedding
await index.upsert([{
  id: `${transcriptId}-${chunkIndex}`,
  values: embedding,
  metadata: {
    transcriptId,
    text: chunk.text,
    timestamp: chunk.timestamp,
    speaker: chunk.speaker,
    confidence: chunk.confidence
  }
}]);

// Search
const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true,
  filter: { transcriptId: { $eq: currentTranscriptId } }
});
```

#### Option B: PostgreSQL + pgvector
```sql
-- Enable pgvector extension
CREATE EXTENSION vector;

-- Create embeddings table
CREATE TABLE transcript_embeddings (
  id SERIAL PRIMARY KEY,
  transcript_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  timestamp_start INTEGER NOT NULL,
  timestamp_end INTEGER NOT NULL,
  speaker VARCHAR(255),
  confidence DECIMAL(3,2),
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON transcript_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Similarity search query
SELECT 
  text, 
  timestamp_start, 
  timestamp_end,
  speaker,
  1 - (embedding <=> $1) as similarity
FROM transcript_embeddings 
WHERE transcript_id = $2
ORDER BY embedding <=> $1 
LIMIT 10;
```

### 3. Transcript Chunking Strategy

```typescript
interface TranscriptChunk {
  id: string;
  transcriptId: string;
  text: string;
  timestampStart: number; // milliseconds
  timestampEnd: number;
  speaker?: string;
  confidence: number;
  chunkIndex: number;
}

class TranscriptChunker {
  chunkBySpeakerTurns(transcript: Transcript): TranscriptChunk[] {
    const chunks: TranscriptChunk[] = [];
    let currentChunk = '';
    let chunkStart = 0;
    let chunkIndex = 0;
    
    for (const segment of transcript.segments) {
      // Start new chunk on speaker change or time gap
      if (this.shouldCreateNewChunk(segment, currentChunk)) {
        if (currentChunk.trim()) {
          chunks.push({
            id: `${transcript.id}-${chunkIndex}`,
            transcriptId: transcript.id,
            text: currentChunk.trim(),
            timestampStart: chunkStart,
            timestampEnd: segment.timestamp,
            speaker: segment.speaker,
            confidence: segment.confidence,
            chunkIndex: chunkIndex++
          });
        }
        currentChunk = segment.text;
        chunkStart = segment.timestamp;
      } else {
        currentChunk += ' ' + segment.text;
      }
    }
    
    return chunks;
  }

  private shouldCreateNewChunk(segment: any, currentChunk: string): boolean {
    return (
      currentChunk.length > 500 || // Max chunk size
      segment.speakerChanged ||    // Speaker change
      segment.silenceGap > 3000    // 3+ second gap
    );
  }
}
```

## API Design

### Search Endpoint

```typescript
// POST /api/transcripts/:id/search
interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number; // Minimum similarity score
  speakers?: string[]; // Filter by speakers
  timeRange?: {
    start: number;
    end: number;
  };
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  queryTime: number;
}

interface SearchResult {
  id: string;
  text: string;
  timestamp: {
    start: number;
    end: number;
  };
  speaker?: string;
  confidence: number;
  similarity: number;
  highlightedText?: string;
}
```

### Implementation

```typescript
export class SemanticSearchService {
  constructor(
    private embeddingService: EmbeddingService,
    private vectorDB: VectorDatabase
  ) {}

  async searchTranscript(
    transcriptId: string, 
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // Generate query embedding
    const queryEmbedding = await this.embeddingService.embed(query);
    
    // Search vector database
    const vectorResults = await this.vectorDB.similaritySearch({
      vector: queryEmbedding,
      filter: { transcriptId },
      limit: options.limit || 20,
      threshold: options.threshold || 0.7,
      ...options
    });
    
    // Format results
    const results = vectorResults.map(result => ({
      id: result.id,
      text: result.metadata.text,
      timestamp: {
        start: result.metadata.timestampStart,
        end: result.metadata.timestampEnd
      },
      speaker: result.metadata.speaker,
      confidence: result.metadata.confidence,
      similarity: result.score,
      highlightedText: this.highlightQuery(result.metadata.text, query)
    }));
    
    return {
      results,
      totalResults: vectorResults.length,
      queryTime: Date.now() - startTime
    };
  }

  private highlightQuery(text: string, query: string): string {
    // Simple highlighting - can be enhanced with semantic highlighting
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
```

## Frontend Integration

### Updated Search Component

```typescript
// components/transcript/SemanticSearch.tsx
import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  transcriptId: string;
  onResultClick: (timestamp: number) => void;
}

export function SemanticSearch({ transcriptId, onResultClick }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  
  const searchTranscript = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [transcriptId]);
  
  useEffect(() => {
    searchTranscript(debouncedQuery);
  }, [debouncedQuery, searchTranscript]);
  
  return (
    <div className="semantic-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript... (try 'budget concerns' or 'action items')"
          className="w-full p-3 border rounded-lg"
        />
        {loading && <SearchSpinner />}
      </div>
      
      <div className="search-results">
        {results.map((result) => (
          <div
            key={result.id}
            className="result-item p-3 border-b cursor-pointer hover:bg-gray-50"
            onClick={() => onResultClick(result.timestamp.start)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500">
                {formatTimestamp(result.timestamp.start)} - {result.speaker}
              </span>
              <span className="text-xs text-blue-600">
                {Math.round(result.similarity * 100)}% match
              </span>
            </div>
            <p 
              className="text-gray-800"
              dangerouslySetInnerHTML={{ __html: result.highlightedText }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTimestamp(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

## Cost Analysis

### OpenAI Embeddings Cost
- **Model**: text-embedding-3-small ($0.02 per 1M tokens)
- **Typical transcript**: 1-hour meeting ≈ 10,000 words ≈ 13,000 tokens
- **Cost per transcript**: ~$0.0003 (less than 1 cent)
- **1000 transcripts/month**: ~$0.30

### Vector Database Costs

#### Pinecone
- **Starter Plan**: $70/month (1M vectors, 100 queries/second)
- **Standard Plan**: $350/month (5M vectors, 300 queries/second)

#### Self-hosted PostgreSQL + pgvector
- **Infrastructure**: $50-200/month (depending on scale)
- **No per-vector or per-query costs**
- **Better for high-volume use cases**

### Storage Requirements
- **Each chunk**: ~6KB (1536 dimensions × 4 bytes + metadata)
- **1-hour transcript**: ~50 chunks = ~300KB
- **1000 transcripts**: ~300MB storage

## Performance Considerations

### Optimization Strategies

1. **Chunking Optimization**
   ```typescript
   // Optimal chunk size: 100-500 tokens
   // Balance between context and granularity
   const OPTIMAL_CHUNK_SIZE = 300;
   const CHUNK_OVERLAP = 50; // Tokens overlap between chunks
   ```

2. **Caching Strategy**
   ```typescript
   // Cache frequent queries
   const queryCache = new Map<string, SearchResult[]>();
   
   // Cache embeddings to avoid re-computation
   const embeddingCache = new Map<string, number[]>();
   ```

3. **Batch Processing**
   ```typescript
   // Process embeddings in batches
   async function batchGenerateEmbeddings(chunks: string[]): Promise<number[][]> {
     const batchSize = 100;
     const embeddings: number[][] = [];
     
     for (let i = 0; i < chunks.length; i += batchSize) {
       const batch = chunks.slice(i, i + batchSize);
       const batchEmbeddings = await openai.embeddings.create({
         model: "text-embedding-3-small",
         input: batch
       });
       
       embeddings.push(...batchEmbeddings.data.map(e => e.embedding));
     }
     
     return embeddings;
   }
   ```

### Performance Benchmarks

| Metric | Target | Notes |
|--------|--------|-------|
| Query latency | <200ms | Including embedding generation |
| Embedding generation | <100ms | Per transcript chunk |
| Storage per transcript | <1MB | Including all chunks and metadata |
| Search accuracy | >85% | Relevant results in top 10 |

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1-2)
1. Set up vector database (Pinecone or pgvector)
2. Implement embedding service
3. Create chunking pipeline
4. Set up background job processing

### Phase 2: Data Migration (Week 3)
1. Process existing transcripts
2. Generate and store embeddings
3. Validate data integrity
4. Performance testing

### Phase 3: API Development (Week 4)
1. Build search API endpoints
2. Implement result ranking
3. Add filtering capabilities
4. Create admin tools

### Phase 4: Frontend Integration (Week 5-6)
1. Update search UI components
2. Add semantic search features
3. Implement result highlighting
4. User testing and feedback

### Phase 5: Launch & Optimization (Week 7-8)
1. Deploy to production
2. Monitor performance metrics
3. Gather user feedback
4. Optimize based on usage patterns

## Code Examples

### Database Schema (PostgreSQL + pgvector)

```sql
-- Transcripts table (existing)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL, -- milliseconds
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transcript segments (existing)
CREATE TABLE transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp_start INTEGER NOT NULL,
  timestamp_end INTEGER NOT NULL,
  speaker VARCHAR(255),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- New: Embeddings table
CREATE TABLE transcript_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  timestamp_start INTEGER NOT NULL,
  timestamp_end INTEGER NOT NULL,
  speaker VARCHAR(255),
  confidence DECIMAL(3,2),
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(transcript_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX idx_embeddings_transcript_id ON transcript_embeddings(transcript_id);
CREATE INDEX idx_embeddings_cosine ON transcript_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_timestamp ON transcript_embeddings(timestamp_start, timestamp_end);
```

### Background Job for Processing

```typescript
// jobs/processTranscriptEmbeddings.ts
import { Queue, Worker } from 'bullmq';

interface ProcessEmbeddingsJob {
  transcriptId: string;
  forceReprocess?: boolean;
}

export const embeddingsQueue = new Queue<ProcessEmbeddingsJob>('embeddings', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export const embeddingsWorker = new Worker<ProcessEmbeddingsJob>(
  'embeddings',
  async (job) => {
    const { transcriptId, forceReprocess } = job.data;
    
    try {
      // Check if already processed
      if (!forceReprocess) {
        const existing = await db.transcriptEmbeddings.findFirst({
          where: { transcriptId }
        });
        if (existing) {
          console.log(`Transcript ${transcriptId} already processed`);
          return;
        }
      }
      
      // Get transcript data
      const transcript = await db.transcript.findUnique({
        where: { id: transcriptId },
        include: { segments: true }
      });
      
      if (!transcript) {
        throw new Error(`Transcript ${transcriptId} not found`);
      }
      
      // Chunk transcript
      const chunker = new TranscriptChunker();
      const chunks = chunker.chunkBySpeakerTurns(transcript);
      
      // Generate embeddings in batches
      const embeddingService = new OpenAIEmbeddingService();
      const texts = chunks.map(chunk => chunk.text);
      const embeddings = await embeddingService.batchEmbed(texts);
      
      // Store in database
      const embeddingRecords = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
      }));
      
      await db.transcriptEmbeddings.createMany({
        data: embeddingRecords
      });
      
      console.log(`Processed ${chunks.length} chunks for transcript ${transcriptId}`);
      
    } catch (error) {
      console.error(`Failed to process transcript ${transcriptId}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
);

// Trigger processing for new transcripts
export async function queueTranscriptProcessing(transcriptId: string) {
  await embeddingsQueue.add('process-embeddings', {
    transcriptId,
    forceReprocess: false
  });
}
```

### Environment Variables

```bash
# .env
# OpenAI (if using OpenAI embeddings)
OPENAI_API_KEY=sk-...

# Pinecone (if using Pinecone)
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp-free

# PostgreSQL with pgvector
DATABASE_URL=postgresql://user:password@localhost:5432/writeitout?sslmode=disable

# Redis (for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Search Configuration
EMBEDDING_MODEL=text-embedding-3-small
SIMILARITY_THRESHOLD=0.7
MAX_SEARCH_RESULTS=20
CHUNK_SIZE=300
CHUNK_OVERLAP=50
```

## Next Steps

### Immediate Actions (Week 1)
1. **Decision on Vector Database**: Choose between Pinecone (quick start) vs pgvector (long-term cost)
2. **Set up development environment** with chosen stack
3. **Create prototype** with small dataset to validate approach
4. **Performance baseline** with current keyword search

### Priority Implementation Order
1. **Core Infrastructure** (Embedding service + Vector DB)
2. **Background Processing** (Chunking + Embedding generation)
3. **Search API** (Basic semantic search)
4. **Frontend Integration** (Updated search UI)
5. **Advanced Features** (Filters, highlighting, relevance tuning)

### Success Metrics
- **Search Relevance**: >85% of queries return relevant results in top 5
- **Performance**: Search latency <200ms average
- **User Adoption**: >50% of searches use semantic vs keyword
- **Cost Efficiency**: <$1 per 1000 transcripts processed

### Future Enhancements
- **Multi-language support** with multilingual embedding models
- **Question answering** over transcripts using RAG (Retrieval Augmented Generation)
- **Automatic topic extraction** and categorization
- **Real-time search** as transcripts are being generated
- **Personalized search** based on user behavior and preferences

---

*This architecture provides a scalable foundation for semantic search that can grow with WriteItOut's user base and feature requirements.*