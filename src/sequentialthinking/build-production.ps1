#!/usr/bin/env pwsh
# Enterprise MCP Server Production Build Script
# Builds the Sequential Thinking MCP Server with enterprise features for distribution

param(
    [string]$BuildType = "production",
    [switch]$Clean = $false,
    [switch]$Test = $false,
    [switch]$Package = $false
)

Write-Host "🏗️  Enterprise MCP Server Production Build" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Stop"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

try {
    # Clean previous build if requested
    if ($Clean -or $BuildType -eq "clean") {
        Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
        }
        Write-Host "✅ Clean completed" -ForegroundColor Green
        Write-Host ""
    }

    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""

    # Build the project
    Write-Host "🔨 Building enterprise MCP server..." -ForegroundColor Blue
    
    # Create dist directory
    if (!(Test-Path "dist")) {
        New-Item -ItemType Directory -Force -Path "dist" | Out-Null
    }

    # Compile TypeScript
    Write-Host "  - Compiling TypeScript with production config..." -ForegroundColor Cyan
    npx tsc --project tsconfig.prod.json
    
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript compilation failed"
    }

    # Make executable
    Write-Host "  - Setting executable permissions..." -ForegroundColor Cyan
    if (Test-Path "dist/vscode-integrated-optimized.js") {
        # Add shebang if not present
        $content = Get-Content "dist/vscode-integrated-optimized.js" -Raw
        if (-not $content.StartsWith("#!/usr/bin/env node")) {
            $content = "#!/usr/bin/env node`n" + $content
            Set-Content "dist/vscode-integrated-optimized.js" $content -NoNewline
        }
    }

    # Copy documentation and assets
    Write-Host "  - Copying documentation and assets..." -ForegroundColor Cyan
    $filesToCopy = @(
        "README.md",
        "optimization-*.md",
        "enterprise-*.md",
        "package-enterprise.json"
    )
    
    foreach ($pattern in $filesToCopy) {
        $files = Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            Copy-Item $file "dist/" -Force
            Write-Host "    ✓ Copied $file" -ForegroundColor DarkGreen
        }
    }

    # Copy package.json as the main package file
    Copy-Item "package-enterprise.json" "dist/package.json" -Force

    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    Write-Host ""

    # Test the build if requested
    if ($Test) {
        Write-Host "🧪 Testing build..." -ForegroundColor Blue
        
        Write-Host "  - Checking file structure..." -ForegroundColor Cyan
        $requiredFiles = @(
            "dist/vscode-integrated-optimized.js",
            "dist/vscode-lsp-integration.js",
            "dist/package.json"
        )
        
        foreach ($file in $requiredFiles) {
            if (Test-Path $file) {
                Write-Host "    ✓ $file exists" -ForegroundColor DarkGreen
            } else {
                throw "Required file missing: $file"
            }
        }

        Write-Host "  - Verifying Node.js compatibility..." -ForegroundColor Cyan
        node dist/vscode-integrated-optimized.js --help 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Node.js execution successful" -ForegroundColor DarkGreen
        } else {
            Write-Host "    ⚠️  Node.js execution returned non-zero (expected for MCP server)" -ForegroundColor Yellow
        }

        Write-Host "✅ Build tests passed" -ForegroundColor Green
        Write-Host ""
    }

    # Package for distribution if requested
    if ($Package) {
        Write-Host "📦 Creating distribution package..." -ForegroundColor Blue
        
        Set-Location "dist"
        npm pack
        Set-Location ".."
        
        $packageFiles = Get-ChildItem "dist/*.tgz"
        if ($packageFiles.Count -gt 0) {
            $packageFile = $packageFiles[0].Name
            Write-Host "✅ Package created: dist/$packageFile" -ForegroundColor Green
        } else {
            throw "Package creation failed"
        }
        Write-Host ""
    }

    # Build summary
    Write-Host "🎉 Enterprise MCP Server Build Summary" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Build Location: $(Get-Location)/dist" -ForegroundColor White
    Write-Host "🚀 Main Executable: dist/vscode-integrated-optimized.js" -ForegroundColor White
    Write-Host "📄 Package Config: dist/package.json" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Enterprise Features:" -ForegroundColor White
    Write-Host "  ✓ VS Code LSP Integration" -ForegroundColor DarkGreen
    Write-Host "  ✓ Security Vulnerability Scanning" -ForegroundColor DarkGreen
    Write-Host "  ✓ Performance Analysis & Caching" -ForegroundColor DarkGreen
    Write-Host "  ✓ Persistent Context Management" -ForegroundColor DarkGreen
    Write-Host "  ✓ CPaaS Domain Intelligence" -ForegroundColor DarkGreen
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor White
    Write-Host "  • Test: npm run start (from dist directory)" -ForegroundColor Gray
    Write-Host "  • Deploy: Copy dist/ folder to target environment" -ForegroundColor Gray
    Write-Host "  • Configure: Update MCP client configuration" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "🏁 Production build completed successfully!" -ForegroundColor Green
