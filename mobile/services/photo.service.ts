/**
 * Photo service — handles picking, uploading, and annotating report photos.
 *
 * Upload path convention:
 *   report-photos/{company_id}/{report_id}/{uuid}.{ext}
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { ReportPhoto, ReportPhotoInsert, PhotoAnnotation } from '@sitewatch/types';

export const photoService = {
  /**
   * Open the device image picker and return the selected asset.
   * Returns null if the user cancels.
   */
  async pickPhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo library permission is required to attach photos.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0];
  },

  /**
   * Open the device camera and return the captured asset.
   * Returns null if the user cancels.
   */
  async takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera permission is required to take photos.');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0];
  },

  /**
   * Upload a photo to Supabase Storage and insert a report_photos record.
   * Returns the newly created ReportPhoto row.
   */
  async uploadPhoto(
    asset: ImagePicker.ImagePickerAsset,
    reportId: string,
    companyId: string,
    sortOrder: number = 0,
    caption?: string
  ): Promise<ReportPhoto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Determine file extension
    const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${companyId}/${reportId}/${fileName}`;

    // Read the file as base64 for upload
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(storagePath, decode(base64), {
        contentType: asset.mimeType ?? 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get a signed URL (valid for 1 hour; the app refreshes as needed)
    const { data: signedData } = await supabase.storage
      .from('report-photos')
      .createSignedUrl(storagePath, 3600);

    const photoPayload: ReportPhotoInsert = {
      report_id: reportId,
      company_id: companyId,
      uploaded_by: user.id,
      storage_path: storagePath,
      public_url: signedData?.signedUrl ?? null,
      mime_type: asset.mimeType ?? 'image/jpeg',
      file_size_bytes: asset.fileSize ?? null,
      annotations: [],
      caption: caption ?? null,
      sort_order: sortOrder,
    };

    const { data, error } = await supabase
      .from('report_photos')
      .insert(photoPayload)
      .select()
      .single();

    if (error) throw error;
    return data as ReportPhoto;
  },

  /**
   * Save updated annotations for a photo.
   */
  async saveAnnotations(
    photoId: string,
    annotations: PhotoAnnotation[]
  ): Promise<void> {
    const { error } = await supabase
      .from('report_photos')
      .update({ annotations: annotations as any })
      .eq('id', photoId);

    if (error) throw error;
  },

  /**
   * Delete a photo from storage and the database.
   */
  async deletePhoto(photoId: string, storagePath: string): Promise<void> {
    await supabase.storage.from('report-photos').remove([storagePath]);

    const { error } = await supabase
      .from('report_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  },

  /**
   * Generate a fresh signed URL for a photo (URLs expire after 1 hour).
   */
  async refreshSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('report-photos')
      .createSignedUrl(storagePath, 3600);

    if (error) throw error;
    return data.signedUrl;
  },
};
