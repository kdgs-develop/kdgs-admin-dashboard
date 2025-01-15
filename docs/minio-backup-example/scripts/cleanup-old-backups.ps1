# C:\minio-backup\scripts\cleanup-old-backups.ps1
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\cleanup-$date.log"

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

    Write-Log "Starting cleanup of backup folders older than 7 days"

    # Get the current date and calculate the cutoff date
    $cutoffDate = (Get-Date).AddDays(-7).ToString("yyyyMMdd")

    # List all folders in the Linode bucket
    $backupFolders = & "C:\rclone\rclone.exe" lsd linode:kdgs-files --config C:\minio-backup\rclone\rclone.conf 2>&1

    # Log the output of the backup folders for verification
    Write-Log "Backup folders output: $backupFolders"

    # Parse the output to find folders and their last modified dates
    foreach ($folder in $backupFolders) {
        # Log each folder being processed
        Write-Log "Processing folder: $folder"

        # The folder name is the last element in the split array
        $folderDetails = $folder -split '\s+'
        $folderName = $folderDetails[-1]  # Get the last element which is the folder name

        # Check if the folder name matches the backup format
        if ($folderName -like "backup-*") {
            # Extract the date from the folder name (e.g., 20250101)
            $folderDateString = $folderName -replace "backup-", ""
            Write-Log "Folder date string: $folderDateString"
            Write-Log "Cutoff date: $cutoffDate"

            # Compare dates as strings (YYYYMMDD format)
            if ([int]$folderDateString -lt [int]$cutoffDate) {
                # Log the folder being deleted
                Write-Log "Deleting folder: $folderName"
                # Remove the folder and its contents
                & "C:\rclone\rclone.exe" purge "linode:kdgs-files/$folderName" --config C:\minio-backup\rclone\rclone.conf 2>&1 | Write-Log
            }
        }
    }

    Write-Log "Cleanup completed successfully"
    exit 0
}
catch {
    Write-Log "Error during cleanup: $_"
    exit 1
}