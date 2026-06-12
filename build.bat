@echo off
REM 用 esbuild 把 main.ts 打包到 dist/bundle.js
REM 用法：双击 build.bat 或在 cmd 里执行
cd /d "%~dp0"
echo [build] Bundling main.ts -> dist/bundle.js
npx --yes esbuild main.ts --bundle --format=esm --outfile=dist/bundle.js --target=es2020 --sourcemap
if %ERRORLEVEL% NEQ 0 (
  echo [build] FAILED
  pause
  exit /b 1
)
echo [build] OK. Open index.html in your browser.
echo.
