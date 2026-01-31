package com.caiths.dengtai.knowpost.api.dto;

import jakarta.validation.constraints.NotNull;

public record KnowPostTopPatchRequest(
        @NotNull Boolean isTop
) {}