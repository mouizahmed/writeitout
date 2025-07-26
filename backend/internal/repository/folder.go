package repository

import (
	"database/sql"
	"fmt"

	"github.com/mouizahmed/justscribe-backend/internal/database"
	"github.com/mouizahmed/justscribe-backend/internal/models"
)

type FolderRepository struct {
	db *database.DB
}

func NewFolderRepository(db *database.DB) *FolderRepository {
	return &FolderRepository{db: db}
}

// GetFolderByID retrieves a folder by its ID and user ID
func (r *FolderRepository) GetFolderByID(folderID, userID string) (*models.Folder, error) {
	query := `
		SELECT id, name, parent_id, user_id, created_at, updated_at, deleted_at
		FROM folders
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	var folder models.Folder
	err := r.db.QueryRow(query, folderID, userID).Scan(
		&folder.ID,
		&folder.Name,
		&folder.ParentID,
		&folder.UserID,
		&folder.CreatedAt,
		&folder.UpdatedAt,
		&folder.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	return &folder, nil
}

// GetBreadcrumbs builds the breadcrumb path for a folder
func (r *FolderRepository) GetBreadcrumbs(folderID, userID string) ([]models.Breadcrumb, error) {
	// Always start with Dashboard (root level)
	breadcrumbs := []models.Breadcrumb{
		{ID: nil, Name: "Dashboard", Href: "/dashboard"},
	}

	// If folderID is empty, we're at root/dashboard level
	if folderID == "" {
		return breadcrumbs, nil
	}

	// Build path recursively using CTE
	query := `
		WITH RECURSIVE folder_path AS (
			-- Base case: start with the target folder
			SELECT id, name, parent_id, 1 as level
			FROM folders
			WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
			
			UNION ALL
			
			-- Recursive case: get parent folders
			SELECT f.id, f.name, f.parent_id, fp.level + 1
			FROM folders f
			INNER JOIN folder_path fp ON f.id = fp.parent_id
			WHERE f.user_id = $2 AND f.deleted_at IS NULL
		)
		SELECT id, name
		FROM folder_path
		ORDER BY level DESC
	`

	rows, err := r.db.Query(query, folderID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get breadcrumbs: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, fmt.Errorf("failed to scan breadcrumb: %w", err)
		}

		breadcrumbs = append(breadcrumbs, models.Breadcrumb{
			ID:   &id,
			Name: name,
			Href: fmt.Sprintf("/dashboard/folder/%s", id),
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating breadcrumbs: %w", err)
	}

	return breadcrumbs, nil
}

// GetFolderContents retrieves folders and files in a given folder
func (r *FolderRepository) GetFolderContents(folderID, userID string) (*models.FolderContents, error) {

	contents := &models.FolderContents{
		Folders: []models.Folder{},
		Files:   []models.File{},
	}

	// Get folders only for now
	folderQuery := `
		SELECT id, name, parent_id, user_id, created_at, updated_at
		FROM folders
		WHERE user_id = $1 AND deleted_at IS NULL
	`

	var folderArgs []interface{}
	folderArgs = append(folderArgs, userID)

	if folderID == "" {
		// Root/dashboard level - get folders with no parent (parent_id IS NULL)
		folderQuery += " AND parent_id IS NULL"
	} else {
		// Specific folder - get child folders
		folderQuery += " AND parent_id = $2"
		folderArgs = append(folderArgs, folderID)
	}

	folderQuery += " ORDER BY name"

	rows, err := r.db.Query(folderQuery, folderArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to get folders: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var folder models.Folder
		err := rows.Scan(
			&folder.ID,
			&folder.Name,
			&folder.ParentID,
			&folder.UserID,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		contents.Folders = append(contents.Folders, folder)
	}

	// TODO: Add files later - for now only handling folders
	// Files array will remain empty but that's fine for dashboard

	return contents, nil
}

// GetFolderData returns complete folder data including breadcrumbs and contents
func (r *FolderRepository) GetFolderData(folderID, userID string) (*models.FolderDataResponse, error) {
	var folder *models.Folder
	var err error

	// Get folder info if not root (empty folderID means root/dashboard)
	if folderID != "" {
		folder, err = r.GetFolderByID(folderID, userID)
		if err != nil {
			return nil, err
		}
		if folder == nil {
			return nil, fmt.Errorf("folder not found")
		}
	}
	// If folderID is empty, folder remains nil which represents root/dashboard

	// Get breadcrumbs
	breadcrumbs, err := r.GetBreadcrumbs(folderID, userID)
	if err != nil {
		return nil, err
	}

	// Get folder contents
	contents, err := r.GetFolderContents(folderID, userID)
	if err != nil {
		return nil, err
	}

	// Build response
	response := &models.FolderDataResponse{
		Folder:      folder, // nil for root/dashboard, actual folder object for subfolders
		Breadcrumbs: breadcrumbs,
		Contents:    *contents,
		Stats: struct {
			TotalFiles   int `json:"total_files"`
			TotalFolders int `json:"total_folders"`
		}{
			TotalFiles:   len(contents.Files),
			TotalFolders: len(contents.Folders),
		},
	}

	return response, nil
}

// CreateFolder creates a new folder
func (r *FolderRepository) CreateFolder(name string, parentID *string, userID string) (*models.Folder, error) {
	query := `
		INSERT INTO folders (name, parent_id, user_id, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, name, parent_id, user_id, created_at, updated_at
	`
	
	var folder models.Folder
	err := r.db.QueryRow(query, name, parentID, userID).Scan(
		&folder.ID,
		&folder.Name,
		&folder.ParentID,
		&folder.UserID,
		&folder.CreatedAt,
		&folder.UpdatedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}
	
	return &folder, nil
}
