# Deployment

1. Build the project

   ```bash
   $ python3 -m build
   ```

   ```
   dist/
    ├── keyboardsounds-X.X.X-py3-none-any.whl
    └── keyboardsounds-X.X.X.tar.gz
   ```

2. Upload to testpypi

   ```bash
   $ python3 -m twine upload --repository testpypi dist/*
   ```

   ```
   Uploading distributions to https://test.pypi.org/legacy/
   Enter your username: __token__
   Enter your password: [paste your API token here]
   Uploading keyboardsounds-X.X.X-py3-none-any.whl
   100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 8.2/8.2 kB • 00:01 • ?
   Uploading keyboardsounds-X.X.X.tar.gz
   100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 6.8/6.8 kB • 00:00 • ?
   ```