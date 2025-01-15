# C:\minio-backup\scripts\daily-backup.ps1
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\backup-$date.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Write-Output $logMessage | Out-File -FilePath $logFile -Append
}

try {
    # Create logs directory if it doesn't exist
    if (-not (Test-Path "C:\minio-backup\logs")) {
        New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
    }

    Write-Log "Starting daily backup"
    
    # Run the rclone copy command
    $output = & "C:\rclone\rclone.exe" copy minio:kdgs-files linode:kdgs-files/backup-$date --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
    Write-Log $output
    
    Write-Log "Backup completed successfully"
    exit 0
}
catch {
    Write-Log "Error during backup: $_"
    exit 1
}