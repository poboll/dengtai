package com.caiths.dengtai.profile.service;

import com.caiths.dengtai.profile.api.dto.ProfilePatchRequest;
import com.caiths.dengtai.profile.api.dto.ProfileResponse;
import com.caiths.dengtai.user.domain.User;

import java.util.Optional;

/**
 * 个人资料业务接口。
 */
public interface ProfileService {

    Optional<User> getById(long userId);

    ProfileResponse updateProfile(long userId, ProfilePatchRequest req);

    ProfileResponse updateAvatar(long userId, String avatarUrl);
}