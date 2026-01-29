# PerfectExpress V2 Integration Guide

This guide details how to push the new frontend code into the existing `ZZYXX-CC/perfectexpress-courier` repository without overwriting the legacy application.

## Prerequisites
- Git installed.
- Access to the target repository.
- The files from this current project downloaded or available locally.

## Integration Steps

Run the following commands in your terminal to create a clean subdirectory for the new app and push it.

```bash
# 1. Clone the existing repository
git clone https://github.com/ZZYXX-CC/perfectexpress-courier.git
cd perfectexpress-courier

# 2. Create a new branch for the V2 integration
git checkout -b feature/frontend-v2

# 3. Create a directory for the new application
# We use 'frontend-v2' to keep it separate from the legacy root files
mkdir frontend-v2

# 4. Copy your new files into this folder
# Assuming your new files (index.html, index.tsx, components/, etc.) are in a folder named 'new-source'
# Adjust the source path '../new-source/*' as needed
cp -r ../new-source/* frontend-v2/

# 5. Verify Structure
# Your repo structure should look like:
# perfectexpress-courier/
# ├── (Old legacy files...)
# └── frontend-v2/
#     ├── index.html
#     ├── index.tsx
#     ├── components/
#     ├── services/
#     └── ...

# 6. Stage and Commit
git add frontend-v2
git commit -m "feat: add perfect-express-v2 frontend implementation"

# 7. Push to GitHub
git push origin feature/frontend-v2
```

## Running the V2 App Locally

To run the app from within the repo:

1.  Navigate to the folder: `cd frontend-v2`
2.  Serve the file using any static server (e.g., Python, VS Code Live Server, or `serve`):
    *   **Python:** `python3 -m http.server 8000`
    *   **Node:** `npx serve .`

## Notes on Pathing

The `index.html` has been updated to use `<script type="module" src="./index.tsx"></script>`. This **relative path** (`./`) is critical. It allows the application to run correctly regardless of whether it is hosted at `domain.com/` or `domain.com/frontend-v2/`.
