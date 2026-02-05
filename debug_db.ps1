Write-Host "🔍 Testing Database Connectivity..." -ForegroundColor Cyan

# 1. Test Direct Connection (Port 5432)
$directHost = "db.htlyympbettzvleequto.supabase.co"
Write-Host "`nTesting Direct Host: $directHost (Port 5432)"
try {
    $tcp = Test-NetConnection -ComputerName $directHost -Port 5432 -InformationLevel Quiet
    if ($tcp) {
        Write-Host "✅ Direct Connection SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ Direct Connection FAILED (Timeout/Blocked)" -ForegroundColor Red
        Write-Host "   -> This is why 'prisma db push' fails." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error testing direct connection: $_" -ForegroundColor Red
}

# 2. Test Pooler Connection (Port 6543)
$poolerHost = "aws-1-ap-southeast-2.pooler.supabase.com"
Write-Host "`nTesting Pooler Host: $poolerHost (Port 6543)"
try {
    $tcp2 = Test-NetConnection -ComputerName $poolerHost -Port 6543 -InformationLevel Quiet
    if ($tcp2) {
        Write-Host "✅ Pooler Connection SUCCESS" -ForegroundColor Green
        Write-Host "   -> The App/Worker use this, so they work!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Pooler Connection FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing pooler connection: $_" -ForegroundColor Red
}

Write-Host "`nRECOMMENDATION:" -ForegroundColor Cyan
if (!$tcp -and $tcp2) {
    Write-Host "Use the POOLER host for migrations too, but on session mode."
    Write-Host "Try updating DIRECT_URL in .env to use port 5432 on the AWS host, or 6543 without pgbouncer=true."
}
