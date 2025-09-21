import { syncMinioWithDatabase } from './minio-actions'; // Adjust the import path as necessary

export async function initialSync() {
  try {
    await syncMinioWithDatabase();
    console.log('Initial synchronization completed successfully.');
  } catch (error) {
    console.error('Error during initial synchronization:', error);
  }
}