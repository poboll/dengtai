package com.caiths.dengtai.storage;

import com.caiths.dengtai.common.exception.BusinessException;
import com.caiths.dengtai.common.exception.ErrorCode;
import com.caiths.dengtai.storage.config.OssProperties;
import com.google.gson.Gson;
import com.qiniu.common.QiniuException;
import com.qiniu.http.Response;
import com.qiniu.storage.Configuration;
import com.qiniu.storage.Region;
import com.qiniu.storage.UploadManager;
import com.qiniu.storage.model.DefaultPutRet;
import com.qiniu.util.Auth;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class OssStorageService {

    private final OssProperties props;

    /**
     * 服务端直传头像文件到七牛云。
     *
     * @param userId 用户 ID，用于构建唯一对象键
     * @param file   上传的文件
     * @return 可公开访问的文件 URL
     */
    public String uploadAvatar(long userId, MultipartFile file) {
        ensureConfigured();

        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String objectKey = props.getFolder() + "/avatars/" + userId + "-" + Instant.now().toEpochMilli() + ext;

        Auth auth = Auth.create(props.getAccessKey(), props.getSecretKey());
        String upToken = auth.uploadToken(props.getBucket(), objectKey);

        Configuration cfg = new Configuration(Region.regionAs0());
        UploadManager uploadManager = new UploadManager(cfg);

        try {
            Response response = uploadManager.put(file.getInputStream(), objectKey, upToken, null, null);
            new Gson().fromJson(response.bodyString(), DefaultPutRet.class);
        } catch (QiniuException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "头像上传失败：" + e.getMessage());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "头像文件读取失败");
        }

        return publicUrl(objectKey);
    }

    /**
     * 生成用于前端直传的七牛云上传凭证（Upload Token）。
     * 前端使用该 token 通过七牛 JS SDK 或 XMLHttpRequest 直接上传，无需服务端中转。
     *
     * @param objectKey      目标对象键（七牛 key），传 null 则以文件 hash 为 key
     * @param expiresSeconds 有效期秒数（建议 600）
     * @return 上传凭证字符串
     */
    public String generateUploadToken(String objectKey, int expiresSeconds) {
        ensureConfigured();
        Auth auth = Auth.create(props.getAccessKey(), props.getSecretKey());
        return auth.uploadToken(props.getBucket(), objectKey, expiresSeconds, null);
    }

    /**
     * 根据对象键拼接公开访问 URL（使用自定义 CDN 域名）。
     */
    public String publicUrl(String objectKey) {
        String domain = props.getDomain().replaceAll("/$", "");
        return domain + "/" + objectKey;
    }

    private void ensureConfigured() {
        if (props.getAccessKey() == null || props.getSecretKey() == null || props.getBucket() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "对象存储未配置");
        }
    }
}
