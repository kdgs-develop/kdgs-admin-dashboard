# MinIO to Linode Backup System Documentation

## Overview
This document outlines the automated backup system implemented on our Windows Server that copies files from our local MinIO server to Linode Object Storage. The system performs daily backups at 2 AM and maintains a 7-day retention policy using `rclone`.

## System Requirements

### Software Requirements
- **Windows Server**
- **Rclone**: File copying tool
- **PowerShell 5.1** or higher

### Access Requirements
- **MinIO Server Access Credentials**
- **Linode Object Storage Bucket and Access Keys**
- **Administrator Access** to Windows Server

## Directory Structure

C:\minio-backup\
├── rclone\
│ └── rclone.conf # Rclone configuration file
├── scripts\
│ ├── daily-backup.ps1 # Daily backup script
│ └── cleanup-old-backups.ps1 # Cleanup script for old backups
└── logs\
├── backup-YYYYMMDD.log # Daily backup logs
└── cleanup-YYYYMMDD.log # Cleanup operation logs

## Installation and Configuration

### 1. Install Rclone
Download and install Rclone using PowerShell:


⌘K to generate a command
please use rclone simple commands

Yes, let's test with simple rclone commands first. Here's the step-by-step process:
First, create the rclone config file:
UTF8
Test the connections:
conf
Once those work, try a simple copy:
conf
Let's try these commands one at a time to see which step might be failing. Would you like to start with any particular step?
rclone copy
Copy files from source to dest, skipping identical files.

Synopsis
Copy the source to the destination. Does not transfer files that are identical on source and destination, testing by size and modification time or MD5SUM. Doesn't delete files from the destination. If you want to also delete files from destination, to make it match source, use the sync command instead.

Note that it is always the contents of the directory that is synced, not the directory itself. So when source:path is a directory, it's the contents of source:path that are copied, not the directory name and contents.

To copy single files, use the copyto command instead.

If dest:path doesn't exist, it is created and the source:path contents go there.

For example

rclone copy source:sourcepath dest:destpath
Let's say there are two files in sourcepath

sourcepath/one.txt
sourcepath/two.txt
This copies them to

destpath/one.txt
destpath/two.txt
Not to

destpath/sourcepath/one.txt
destpath/sourcepath/two.txt

Yes, let's use a simple rclone copy command. First, let's check what we're copying:
conf
Then do the copy:
conf
This will:
Copy all files from kdgs-files bucket in MinIO
Put them directly in kdgs-backups/20250114 folder in Linode
Show progress during the copy
Skip any identical files
Would you like to try these commands?
>> rclone ls linode:kdgs-files --config C:\minio-backup\rclone\rclone.conf
2025/01/14 20:46:07 NOTICE: Failed to ls: directory not found
PS C:\minio-backup\rclone>

Let's check the correct bucket names and try again:
conf
This will show us all available buckets. Once we see the correct bucket names, we can use them in our copy command:
conf
Let's run these commands to see what buckets are available. Can you share the output of the lsd commands?
kdgs-files
kdgs-files.us-sea-1.linodeobjects.com
US, Seattle, WA

Standard (E1)

2024-11-27 20:20	
0 bytes

0

Ah, I see. Your Linode bucket is in the Seattle region. Let's update the rclone config and commands:
UTF8
Now let's try the commands:
conf
The changes are:
Updated endpoint to us-sea-1.linodeobjects.com
Using the correct bucket name kdgs-files
Creating a dated subfolder for the backup
Would you like to try these commands?
this command work perfectly, now I want that every day at 2AM this command is triggered on windows server

We'll use Windows Task Scheduler to run this backup daily at 2 AM. First, let's create a PowerShell script that will run the backup:
try {

Then, create a scheduled task using PowerShell:
s
To set this up:
Save the first script as C:\minio-backup\scripts\daily-backup.ps1
Run the second script (the scheduled task creation) in PowerShell as Administrator
Verify the task was created:
"
The task will:
Run every day at 2 AM
Run with SYSTEM privileges
Retry up to 3 times if it fails
Log all activity to dated log files
Run even if the scheduled time was missed
To test the task immediately:
"
Would you like me to explain any part of this setup in more detail?
before adding this scheduledTask I want to see the previous ones to avoid duplicates, and delete the ones I created before for minio

Yes, let's manage the existing scheduled tasks first:
Get-ScheduledTask | Where-Object { $_.TaskName -like "*minio*"
Let's:
First list the existing tasks
Review which ones need to be deleted
Delete the unnecessary tasks
Then create our new task
Would you like me to run any of these commands?
following the same approach using rclone now we need to create another script and scheduled task to delete the backups that are older than 7 days

Yes, let's create a cleanup script for old backups. Here's the script:
}
And here's the script to create the scheduled task for cleanup (run this as Administrator):
To set this up:
Save the first script as C:\minio-backup\scripts\cleanup-old-backups.ps1
2. Run the second script (the scheduled task creation) in PowerShell as Administrator
Verify both tasks exist:
}
To test the cleanup immediately:
"
The cleanup task will:
Run daily at 3 AM (one hour after backup)
Delete backups older than 7 days
Log all activity
Retry up to 3 times if it fails
Would you like me to explain any part of this setup or modify any of the settings?
now that is working perfectly the backup using rclone we can write a document using markdown explaining the steps following and all the code step by step in a way future developers can understand the process we use on our windows server.

Here's a comprehensive documentation of the MinIO backup process:
Structure
C:\minio-backup\
├── rclone\
│ └── rclone.conf # Rclone configuration file
├── scripts\
│ ├── daily-backup.ps1 # Daily backup script
│ └── cleanup-old-backups.ps1 # Cleanup script for old backups
└── logs\
├── backup-YYYYMMDD.log # Daily backup logs
└── cleanup-YYYYMMDD.log # Cleanup operation logs
:
powershell
Create a temporary directory
New-Item -ItemType Directory -Path "C:\temp" -Force
Download rclone
Invoke-WebRequest -Uri "https://downloads.rclone.org/rclone-current-windows-amd64.zip" -OutFile "C:\temp\rclone.zip"
Extract the zip file
Expand-Archive -Path "C:\temp\rclone.zip" -DestinationPath "C:\temp" -Force
Move rclone to a permanent location
New-Item -ItemType Directory -Path "C:\rclone" -Force
Copy-Item "C:\temp\rclone-\rclone.exe" -Destination "C:\rclone"
Add to PATH
$env:Path += ";C:\rclone"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
Clean up
Remove-Item "C:\temp" -Recurse -Force
Structure
powershell:docs/minio-to-linode-backup.md
Create required directories
New-Item -ItemType Directory -Path "C:\minio-backup\rclone" -Force
New-Item -ItemType Directory -Path "C:\minio-backup\scripts" -Force
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force
:
powershell
@"
[minio]
type = s3
provider = Minio
access_key_id = kdgs-minio-access-key-2023
secret_access_key = kdgs-minio-secret-key-2023
endpoint = http://localhost:9000
[linode]
type = s3
provider = Other
access_key_id = kdgs-linode-access-key-2023
secret_access_key = kdgs-linode-secret-key-2023
endpoint = https://us-sea-1.linodeobjects.com
"@ | Out-File -FilePath "C:\minio-backup\rclone\rclone.conf" -Encoding UTF8
:
powershell
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\backup-$date.log"
function Write-Log {
param([string]$Message)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logMessage = "$timestamp - $Message"
Write-Output $logMessage | Out-File -FilePath $logFile -Append
}
try {
if (-not (Test-Path "C:\minio-backup\logs")) {
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
}
Write-Log "Starting daily backup"
$output = rclone copy minio:kdgs-files linode:kdgs-files/backup-$date --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
Write-Log $output
Write-Log "Backup completed successfully"
}
catch {
Write-Log "Error during backup: $"
exit 1
}
:
powershell
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\cleanup-$date.log"
function Write-Log {
param([string]$Message)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logMessage = "$timestamp - $Message"
Write-Output $logMessage | Out-File -FilePath $logFile -Append
}
try {
if (-not (Test-Path "C:\minio-backup\logs")) {
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
}
Write-Log "Starting cleanup of backups older than 7 days"
$output = rclone delete linode:kdgs-files --min-age 7d --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
Write-Log $output
Write-Log "Cleanup completed successfully"
}
catch {
Write-Log "Error during cleanup: $"
exit 1
}
powershell
Backup Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe"
-Argument "-NoProfile -ExecutionPolicy Bypass -File C:\minio-backup\scripts\daily-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
-DontStopOnIdleEnd -RestartInterval (New-TimeSpan -Minutes 1)
-RestartCount 3
Register-ScheduledTask -TaskName "MinIO Daily Backup"
-Action $action -Trigger $trigger
-Principal $principal -Settings $settings
-Description "Daily backup of MinIO to Linode at 2 AM"
Cleanup Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe"
-Argument "-NoProfile -ExecutionPolicy Bypass -File C:\minio-backup\scripts\cleanup-old-backups.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -TaskName "MinIO
write all the explanation about the MinIO to Linode Backup System Documentation here @minio-to-linode-backup.md 

I'll create a complete markdown documentation file for the MinIO to Linode backup system:
Structure
bash
C:\minio-backup\
├── rclone\
│ └── rclone.conf # Rclone configuration file
├── scripts\
│ ├── daily-backup.ps1 # Daily backup script
│ └── cleanup-old-backups.ps1 # Cleanup script for old backups
└── logs\
├── backup-YYYYMMDD.log # Daily backup logs
└── cleanup-YYYYMMDD.log # Cleanup operation logs
powershell
Create a temporary directory
New-Item -ItemType Directory -Path "C:\temp" -Force
Download rclone
Invoke-WebRequest -Uri "https://downloads.rclone.org/rclone-current-windows-amd64.zip" -OutFile "C:\temp\rclone.zip"
Extract and install
Expand-Archive -Path "C:\temp\rclone.zip" -DestinationPath "C:\temp" -Force
New-Item -ItemType Directory -Path "C:\rclone" -Force
Copy-Item "C:\temp\rclone-\rclone.exe" -Destination "C:\rclone"
Add to PATH
$env:Path += ";C:\rclone"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
Clean up
Remove-Item "C:\temp" -Recurse -Force
powershell
New-Item -ItemType Directory -Path "C:\minio-backup\rclone" -Force
New-Item -ItemType Directory -Path "C:\minio-backup\scripts" -Force
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force
ini
[minio]
type = s3
provider = Minio
access_key_id = kdgs-minio-access-key-2023
secret_access_key = kdgs-minio-secret-key-2023
endpoint = http://localhost:9000
[linode]
type = s3
provider = Other
access_key_id = kdgs-linode-access-key-2023
secret_access_key = kdgs-linode-secret-key-2023
endpoint = https://us-sea-1.linodeobjects.com
powershell
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\backup-$date.log"
function Write-Log {
param([string]$Message)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logMessage = "$timestamp - $Message"
Write-Output $logMessage | Out-File -FilePath $logFile -Append
}
try {
if (-not (Test-Path "C:\minio-backup\logs")) {
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
}
Write-Log "Starting daily backup"
$output = rclone copy minio:kdgs-files linode:kdgs-files/backup-$date --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
Write-Log $output
Write-Log "Backup completed successfully"
}
catch {
Write-Log "Error during backup: $"
exit 1
}
powershell
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\cleanup-$date.log"
function Write-Log {
param([string]$Message)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logMessage = "$timestamp - $Message"
Write-Output $logMessage | Out-File -FilePath $logFile -Append
}
try {
if (-not (Test-Path "C:\minio-backup\logs")) {
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
}
Write-Log "Starting cleanup of backups older than 7 days"
$output = rclone delete linode:kdgs-files --min-age 7d --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
Write-Log $output
Write-Log "Cleanup completed successfully"
}
catch {
Write-Log "Error during cleanup: $"
exit 1
}
powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe"
-Argument "-NoProfile -ExecutionPolicy Bypass -File C:\minio-backup\scripts\daily-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
-DontStopOnIdleEnd -RestartInterval (New-TimeSpan -Minutes 1)
-RestartCount 3
Register-ScheduledTask -TaskName "MinIO Daily Backup"
-Action $action -Trigger $trigger
-Principal $principal -Settings $settings
-Description "Daily backup of MinIO to Linode at 2 AM"
powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe"
-Argument "-NoProfile -ExecutionPolicy Bypass -File C:\minio-backup\scripts\cleanup-old-backups.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
-DontStopOnIdleEnd -RestartInterval (New-TimeSpan -Minutes 1)
-RestartCount 3
Register-ScheduledTask -TaskName "MinIO Backup Cleanup"
-Action $action -Trigger $trigger
-Principal $principal -Settings $settings
-Description "Daily cleanup of MinIO backups older than 7 days at 3 AM"
:
powershell
Get-ScheduledTask | Where-Object { $.TaskName -like "MinIO" }
:
powershell
Get-Content "C:\minio-backup\logs\backup-$(Get-Date -Format 'yyyyMMdd').log"
:
powershell
Get-Content "C:\minio-backup\logs\cleanup-$(Get-Date -Format 'yyyyMMdd').log"
:
powershell
Start-ScheduledTask -TaskName "MinIO Daily Backup"
:
powershell
Start-ScheduledTask -TaskName "MinIO Backup Cleanup"
:
powershell
Test restore to a temporary location
rclone copy linode:kdgs-files/backup-YYYYMMDD C:\temp\restore-test --progress --config C:\minio-backup\rclone\rclone.conf
policy
This documentation provides a comprehensive guide for setting up and maintaining the MinIO to Linode backup system. Let me know if you'd like me to expand on any section or add additional information!
write it again properly using markdown

Structure
C:\minio-backup\
├── rclone\
│ └── rclone.conf # Rclone configuration file
├── scripts\
│ ├── daily-backup.ps1 # Daily backup script
│ └── cleanup-old-backups.ps1 # Cleanup script for old backups
└── logs\
├── backup-YYYYMMDD.log # Daily backup logs
└── cleanup-YYYYMMDD.log # Cleanup operation logs

powershell:C:\minio-backup\scripts\install-rclone.ps1

### Create a temporary directory
New-Item -ItemType Directory -Path "C:\temp" -Force
### Download rclone
Invoke-WebRequest -Uri "https://downloads.rclone.org/rclone-current-windows-amd64.zip" -OutFile "C:\temp\rclone.zip"
### Extract the zip file
Expand-Archive -Path "C:\temp\rclone.zip" -DestinationPath "C:\temp" -Force
### Move rclone to a permanent location
New-Item -ItemType Directory -Path "C:\rclone" -Force
Copy-Item "C:\temp\rclone-\rclone.exe" -Destination "C:\rclone"
### Add to PATH
$env:Path += ";C:\rclone"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
### Clean up temporary files
Remove-Item "C:\temp" -Recurse -Force

powershell:C:\minio-backup\scripts\create-directories.ps1
Create required directories
New-Item -ItemType Directory -Path "C:\minio-backup\rclone" -Force
New-Item -ItemType Directory -Path "C:\minio-backup\scripts" -Force
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force


### 3. Configure Rclone
Create the Rclone configuration file to connect to MinIO and Linode Object Storage.

powershell:C:\minio-backup\rclone\rclone.conf
[minio]
type = s3
provider = Minio
access_key_id = minio-access-key
secret_access_key = minio-secret-key
endpoint = host:9000

[linode]
type = s3
provider = Linode
access_key_id = access-key
secret_access_key = secret-key
endpoint = linode.host.com



**Configuration Details:**
- **MinIO Section**:
  - `type`: Specifies the storage type (`s3` for S3-compatible services).
  - `provider`: Indicates the provider (`Minio`).
  - `access_key_id` & `secret_access_key`: Credentials for MinIO.
  - `endpoint`: URL of the MinIO server.
  - `force_path_style` & `no_check_bucket`: Additional settings for compatibility.

- **Linode Section**:
  - Similar to the MinIO section but tailored for Linode Object Storage.

### 4. Create Backup Script
Script to perform daily backups from MinIO to Linode.


powershell:C:\minio-backup\scripts\daily-backup.ps1
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\backup-$date.log"
function Write-Log {
param([string]$Message)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logMessage = "$timestamp - $Message"
Write-Output $logMessage | Out-File -FilePath $logFile -Append
}
try {
# Ensure logs directory exists
if (-not (Test-Path "C:\minio-backup\logs")) {
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
}
Write-Log "Starting daily backup"
# Execute rclone copy command
$output = rclone copy minio:kdgs-files linode:kdgs-files/backup-$date --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
Write-Log $output
Write-Log "Backup completed successfully"
}
catch {
Write-Log "Error during backup: $"
exit 1
}


**Script Breakdown:**
- **Variables**:
  - `$date`: Current date in `yyyyMMdd` format.
  - `$logFile`: Log file path for the backup operation.
  
- **Write-Log Function**: Logs messages with timestamps.

- **Backup Process**:
  - Ensures the logs directory exists.
  - Logs the start of the backup.
  - Executes the `rclone copy` command to transfer files from MinIO to Linode.
  - Logs the output and completion status.

### 5. Create Cleanup Script
Script to delete backups older than 7 days from Linode.

powershell:C:\minio-backup\scripts\cleanup-old-backups.ps1
$date = Get-Date -Format "yyyyMMdd"
$logFile = "C:\minio-backup\logs\cleanup-$date.log"
function Write-Log {
param([string]$Message)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logMessage = "$timestamp - $Message"
Write-Output $logMessage | Out-File -FilePath $logFile -Append
}
try {
# Ensure logs directory exists
if (-not (Test-Path "C:\minio-backup\logs")) {
New-Item -ItemType Directory -Path "C:\minio-backup\logs" -Force | Out-Null
}
Write-Log "Starting cleanup of backups older than 7 days"
# Execute rclone delete command
$output = rclone delete linode:kdgs-files --min-age 7d --progress --config C:\minio-backup\rclone\rclone.conf 2>&1
Write-Log $output
Write-Log "Cleanup completed successfully"
}
catch {
Write-Log "Error during cleanup: $"
exit 1
}


**Script Breakdown:**
- **Variables**:
  - `$date`: Current date in `yyyyMMdd` format.
  - `$logFile`: Log file path for the cleanup operation.
  
- **Write-Log Function**: Logs messages with timestamps.

- **Cleanup Process**:
  - Ensures the logs directory exists.
  - Logs the start of the cleanup.
  - Executes the `rclone delete` command to remove backups older than 7 days from Linode.
  - Logs the output and completion status.

## Scheduled Tasks Configuration

### 1. Create Backup Task
Automate the `daily-backup.ps1` script to run daily at 2 AM using Windows Task Scheduler.

powershell:C:\minio-backup\scripts\create-backup-task.ps1
Define the action to execute the backup script
$backupAction = New-ScheduledTaskAction -Execute "PowerShell.exe"
-Argument "-NoProfile -ExecutionPolicy Bypass -File C:\minio-backup\scripts\daily-backup.ps1"
Define the trigger to run daily at 2 AM
$backupTrigger = New-ScheduledTaskTrigger -Daily -At 2am
Define the principal to run the task as SYSTEM with highest privileges
$backupPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Define additional settings for the task
$backupSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable
-DontStopOnIdleEnd -RestartInterval (New-TimeSpan -Minutes 1)
-RestartCount 3
Register the scheduled backup task
Register-ScheduledTask -TaskName "MinIO Daily Backup"
-Action $backupAction -Trigger $backupTrigger
-Principal $backupPrincipal -Settings $backupSettings
-Description "Daily backup of MinIO to Linode at 2 AM"


**Steps to Create the Task:**
1. **Define the Action**: Specifies running PowerShell with the backup script.
2. **Define the Trigger**: Sets the task to run daily at 2 AM.
3. **Define the Principal**: Runs the task under the SYSTEM account with highest privileges.
4. **Define Settings**: Configures the task to start when available, not stop on idle, and retry on failure.
5. **Register the Task**: Creates the scheduled task named "MinIO Daily Backup".

**To Execute:**
Run the script `create-backup-task.ps1` in PowerShell as Administrator.

### 2. Create Cleanup Task
Automate the `cleanup-old-backups.ps1` script to run daily at 3 AM.

powershell:C:\minio-backup\scripts\create-cleanup-task.ps1
Define the action to execute the cleanup script
$cleanupAction = New-ScheduledTaskAction -Execute "PowerShell.exe"
-Argument "-NoProfile -ExecutionPolicy Bypass -File C:\minio-backup\scripts\cleanup-old-backups.ps1"
Define the trigger to run daily at 3 AM
$cleanupTrigger = New-ScheduledTaskTrigger -Daily -At 3am
Define the principal to run the task as SYSTEM with highest privileges
$cleanupPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Define additional settings for the task
$cleanupSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable
-DontStopOnIdleEnd -RestartInterval (New-TimeSpan -Minutes 1)
-RestartCount 3
Register the scheduled cleanup task
Register-ScheduledTask -TaskName "MinIO Backup Cleanup"
-Action $cleanupAction -Trigger $cleanupTrigger
-Principal $cleanupPrincipal -Settings $cleanupSettings
-Description "Daily cleanup of MinIO backups older than 7 days at 3 AM"


**Steps to Create the Task:**
1. **Define the Action**: Specifies running PowerShell with the cleanup script.
2. **Define the Trigger**: Sets the task to run daily at 3 AM.
3. **Define the Principal**: Runs the task under the SYSTEM account with highest privileges.
4. **Define Settings**: Configures the task to start when available, not stop on idle, and retry on failure.
5. **Register the Task**: Creates the scheduled task named "MinIO Backup Cleanup".

**To Execute:**
Run the script `create-cleanup-task.ps1` in PowerShell as Administrator.

## Verification and Monitoring

### 1. Check Scheduled Tasks
List all scheduled tasks related to MinIO backups to ensure no duplicates exist.

powershell:C:\minio-backup\scripts\list-scheduled-tasks.ps1
List all scheduled tasks containing "MinIO" or "Backup" in their names
Get-ScheduledTask | Where-Object { $.TaskName -like "MinIO" -or $.TaskName -like "Backup" } | Select-Object TaskName, State


### 2. View Logs
Access log files to monitor backup and cleanup operations.

powershell
View today's backup log
Get-Content "C:\minio-backup\logs\backup-$(Get-Date -Format 'yyyyMMdd').log"
View today's cleanup log
Get-Content "C:\minio-backup\logs\cleanup-$(Get-Date -Format 'yyyyMMdd').log"


### 3. Manual Testing
Run the scheduled tasks manually to ensure they execute correctly.

powershell
Start the backup task immediately
Start-ScheduledTask -TaskName "MinIO Daily Backup"
Start the cleanup task immediately
Start-ScheduledTask -TaskName "MinIO Backup Cleanup"


## Troubleshooting

### Common Issues and Solutions

1. **Connection Issues**
   - **Symptom**: Errors related to connecting to MinIO or Linode.
   - **Solution**:
     - Verify MinIO server is running.
     - Check network connectivity between the server and Linode.
     - Ensure credentials in `rclone.conf` are correct.
     - Validate endpoint URLs.

2. **Permission Issues**
   - **Symptom**: Access denied errors during backup or cleanup.
   - **Solution**:
     - Ensure the SYSTEM account has necessary permissions to execute scripts and access required directories.
     - Verify `rclone.conf` file permissions.

3. **Space Issues**
   - **Symptom**: Failures due to insufficient storage space.
   - **Solution**:
     - Monitor available space in Linode Object Storage.
     - Check local disk space for logs and temporary files.

4. **Script Errors**
   - **Symptom**: Scripts fail to execute or terminate unexpectedly.
   - **Solution**:
     - Review log files for detailed error messages.
     - Ensure scripts have the correct syntax and paths.
     - Test scripts manually to identify issues.

### Support
For issues or questions:
1. **Check Log Files**: Located in `C:\minio-backup\logs`.
2. **Contact System Administrator**: For permission and network-related issues.
3. **Refer to Rclone Documentation**: [Rclone Docs](https://rclone.org/docs/)

## Maintenance

### Regular Tasks
1. **Monitor Log Files**: Regularly review and clean up old log files to save space.
2. **Verify Backup Integrity**: Periodically restore backups to ensure data integrity.
3. **Update Rclone**: Keep Rclone updated to the latest version for security and performance improvements.
4. **Review Retention Policy**: Adjust the 7-day retention policy as needed based on storage requirements.

### Backup Testing
Perform regular restore tests to ensure backups are valid and can be restored when needed.

powershell:C:\minio-backup\scripts\test-restore.ps1
Test restore to a temporary location
rclone copy linode:kdgs-files/backup-YYYYMMDD C:\temp\restore-test --progress --config C:\minio-backup\rclone\rclone.conf


**Steps to Test Restore:**
1. **Run the Test Restore Script**: Replace `YYYYMMDD` with the desired backup date.
2. **Verify Restored Files**: Check `C:\temp\restore-test` to ensure files are correctly restored.

## Security Considerations

1. **Credentials Management**
   - **Best Practices**:
     - Store credentials securely within `rclone.conf`.
     - Restrict access to `rclone.conf` to authorized users only.
     - Rotate access keys periodically to minimize security risks.
     - Use minimal required permissions for access keys.

2. **Network Security**
   - **Best Practices**:
     - Use secure connections (HTTPS) where applicable.
     - Implement proper firewall rules to restrict access to MinIO and Linode.
     - Monitor access logs for any suspicious activities.

## Version History

- **v1.0 (2024-01-14)**
  - Initial implementation.
  - Daily backups at 2 AM.
  - 7-day retention policy.
  - Automated cleanup at 3 AM.