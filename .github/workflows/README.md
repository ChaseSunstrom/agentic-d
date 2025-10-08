# GitHub Workflows

## Build and Release Workflow

The `build-release.yml` workflow automatically builds and releases binaries for multiple platforms when code is pushed to the `main` branch.

### Platforms Supported

- **Linux**: AppImage and DEB packages
- **Windows**: NSIS installer and portable executable
- **macOS**: DMG and ZIP archives

### Workflow Trigger

The workflow is triggered automatically on:
- Push to `main` branch
- Merge to `main` branch

### How it Works

1. **Build Phase**: 
   - Runs parallel builds on Linux, Windows, and macOS runners
   - Installs all dependencies including native modules (robotjs, node-llama-cpp)
   - Builds the Electron application for each platform
   - Uploads build artifacts

2. **Release Phase**:
   - Downloads all platform artifacts
   - Creates a GitHub release with tag format: `v{version}-{run_number}`
   - Attaches all binaries to the release
   - Includes release notes with commit information

### Release Versioning

Releases are automatically versioned based on:
- Version from `package.json`
- GitHub run number (to ensure uniqueness)
- Format: `v1.0.0-123` where `123` is the workflow run number

### Requirements

The workflow requires:
- Node.js 18
- Python 3.11 (for native module compilation)
- Platform-specific build tools (automatically installed)

### Native Dependencies

The workflow handles native dependencies including:
- `robotjs` - requires libxtst-dev and libpng++-dev on Linux
- `node-llama-cpp` - requires Python for node-gyp compilation

### Manual Release

If you need to create a release manually without pushing to main:
1. Go to Actions tab in GitHub
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Select the branch to build from

### Troubleshooting

If the build fails:
1. Check the Actions logs for specific error messages
2. Verify all dependencies are correctly specified in `package.json`
3. Ensure native dependencies can be built on the target platform
4. Check that the electron-builder configuration in `package.json` is correct

### Security

The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions. No additional secrets are required unless you need to sign the binaries (see electron-builder documentation for code signing).
