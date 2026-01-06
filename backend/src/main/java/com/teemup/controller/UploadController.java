package com.teemup.controller;

import com.teemup.dto.upload.UploadResponse;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) throws IOException {
        validateImageFile(file);

        String url = cloudinaryService.uploadProfilePicture(file, userDetails.getId().toString());

        return ResponseEntity.ok(UploadResponse.builder()
                .url(url)
                .type("profile_picture")
                .build());
    }

    @PostMapping(value = "/cover-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadCoverImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) throws IOException {
        validateImageFile(file);

        String url = cloudinaryService.uploadCoverImage(file, userDetails.getId().toString());

        return ResponseEntity.ok(UploadResponse.builder()
                .url(url)
                .type("cover_image")
                .build());
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadGenericImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "misc") String folder
    ) throws IOException {
        validateImageFile(file);

        String url = cloudinaryService.uploadImage(file, folder);

        return ResponseEntity.ok(UploadResponse.builder()
                .url(url)
                .type("image")
                .build());
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Le fichier doit etre une image");
        }

        // Max 10MB
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("L'image ne doit pas depasser 10MB");
        }
    }
}
