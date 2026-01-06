package com.teemup.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        Map<String, Object> options = ObjectUtils.asMap(
                "folder", "teemup/" + folder,
                "resource_type", "image",
                "transformation", "c_limit,w_1200,h_1200,q_auto:good"
        );

        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
        String url = (String) result.get("secure_url");

        log.info("Image uploaded successfully: {}", url);
        return url;
    }

    public String uploadProfilePicture(MultipartFile file, String userId) throws IOException {
        Map<String, Object> options = ObjectUtils.asMap(
                "folder", "teemup/profiles",
                "public_id", "profile_" + userId,
                "overwrite", true,
                "resource_type", "image",
                "transformation", "c_fill,w_500,h_500,g_face,q_auto:good"
        );

        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
        return (String) result.get("secure_url");
    }

    public String uploadCoverImage(MultipartFile file, String userId) throws IOException {
        Map<String, Object> options = ObjectUtils.asMap(
                "folder", "teemup/covers",
                "public_id", "cover_" + userId,
                "overwrite", true,
                "resource_type", "image",
                "transformation", "c_fill,w_1200,h_400,q_auto:good"
        );

        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
        return (String) result.get("secure_url");
    }

    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deleted: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete image: {}", publicId, e);
        }
    }
}
