"use client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { DatabaseBackup } from "./database-backup";

export function AdminBackup() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-4">
          <h3 className="font-semibold text-sm">Automated Backup:</h3>
          <ol className="list-decimal list-inside mt-2">
            <li>
              Click "Download Database Backup" to get a JSON file with all
              database records.
            </li>
            <li>
              To restore, use a custom script to read the JSON and insert data
              using Prisma.
            </li>
            <li>
              Run the restoration process in a controlled environment, ideally
              in a staging setup first.
            </li>
          </ol>
          <div className="mt-4">
            <DatabaseBackup />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm">
            Manual Backup using pg_dump: (Recommended option)
          </h3>
          <div className="mt-2">
            For a more comprehensive backup, you can use pg_dump from your local
            machine:
          </div>

          <h4 className="font-semibold text-sm mt-2">For Windows:</h4>
          <ol className="list-decimal list-inside mt-2">
            <li>Open Command Prompt or PowerShell</li>
            <li>Ensure you have PostgreSQL tools installed and in your PATH</li>
            <li>
              Run the following command:
              <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
                pg_dump DATABASE_URL -Fc -v -f kdgs_dashboard_backup.dump
              </pre>
            </li>
            <li>Enter your password if prompted</li>
          </ol>

          <h4 className="font-semibold text-sm mt-4">For Mac/Linux:</h4>
          <ol className="list-decimal list-inside mt-2">
            <li>Open Terminal</li>
            <li>Ensure you have PostgreSQL tools installed</li>
            <li>
              Run the following command:
              <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
                pg_dump DATABASE_URL -Fc -v -f kdgs_dashboard_backup.dump
              </pre>
            </li>
            <li>Enter your password if prompted</li>
          </ol>

          <h4 className="font-semibold text-sm mt-4">Restoring from backup:</h4>
          <div className="mt-2">
            To restore from a pg_dump backup, use the following command:
          </div>
          <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
            pg_restore -d DATABASE_URL -c -v kdgs_dashboard_backup.dump
          </pre>

          <div className="mt-4">
            <strong>Note:</strong> The database URL is pre-filled based on your
            current configuration. Ensure you have the necessary permissions to
            perform these operations.
          </div>

          <div className="mt-4">
            It's recommended to perform regular backups and store them securely.
            Always test your backup and restoration process in a non-production
            environment first.
          </div>
        </div>
      </div>
    </div>
  );
}
