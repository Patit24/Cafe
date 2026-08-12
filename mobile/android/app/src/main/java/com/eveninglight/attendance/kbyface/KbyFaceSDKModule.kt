package com.eveninglight.attendance.kbyface

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import com.kbyai.facesdk.FaceBox
import com.kbyai.facesdk.FaceDetectionParam
import com.kbyai.facesdk.FaceSDK

class KbyFaceSDKModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var isInitialized = false

    override fun getName(): String {
        return "KbyFaceSDK"
    }

    @ReactMethod
    fun initSDK(activationKey: String, promise: Promise) {
        try {
            var ret = FaceSDK.setActivation(activationKey)
            if (ret == FaceSDK.SDK_SUCCESS) {
                ret = FaceSDK.init(reactContext.assets)
            }

            if (ret == FaceSDK.SDK_SUCCESS) {
                isInitialized = true
                val res = Arguments.createMap()
                res.putBoolean("success", true)
                res.putInt("code", ret)
                promise.resolve(res)
            } else {
                val res = Arguments.createMap()
                res.putBoolean("success", false)
                res.putInt("code", ret)
                res.putString("error", getErrorMessage(ret))
                promise.resolve(res)
            }
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun detectFaceAndExtractTemplate(
        base64Image: String,
        checkLiveness: Boolean,
        promise: Promise
    ) {
        try {
            ensureInitialized()

            val cleanBase64 = if (base64Image.contains(",")) {
                base64Image.substring(base64Image.indexOf(",") + 1)
            } else {
                base64Image
            }

            val imageBytes = Base64.decode(cleanBase64, Base64.NO_WRAP)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)

            if (bitmap == null) {
                val res = Arguments.createMap()
                res.putBoolean("faceDetected", false)
                res.putString("reason", "invalid_image")
                promise.resolve(res)
                return
            }

            val param = FaceDetectionParam()
            param.check_liveness = checkLiveness
            param.check_liveness_level = 0

            val faceBoxes = FaceSDK.faceDetection(bitmap, param)

            if (faceBoxes == null || faceBoxes.isEmpty()) {
                val res = Arguments.createMap()
                res.putBoolean("faceDetected", false)
                res.putString("reason", "no_face_detected")
                promise.resolve(res)
                return
            }

            val faceBox = faceBoxes[0]
            val templateBytes = FaceSDK.templateExtraction(bitmap, faceBox)
            val templateBase64 = if (templateBytes != null) {
                Base64.encodeToString(templateBytes, Base64.NO_WRAP)
            } else {
                ""
            }

            val res = Arguments.createMap()
            res.putBoolean("faceDetected", true)
            res.putDouble("liveness", faceBox.liveness.toDouble())
            res.putDouble("yaw", faceBox.yaw.toDouble())
            res.putDouble("roll", faceBox.roll.toDouble())
            res.putDouble("pitch", faceBox.pitch.toDouble())
            res.putString("template", templateBase64)

            val bbox = Arguments.createMap()
            bbox.putInt("x1", faceBox.x1)
            bbox.putInt("y1", faceBox.y1)
            bbox.putInt("x2", faceBox.x2)
            bbox.putInt("y2", faceBox.y2)
            res.putMap("bbox", bbox)

            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("DETECTION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun calculateSimilarity(
        template1Base64: String,
        template2Base64: String,
        promise: Promise
    ) {
        try {
            ensureInitialized()
            val t1Bytes = Base64.decode(template1Base64, Base64.NO_WRAP)
            val t2Bytes = Base64.decode(template2Base64, Base64.NO_WRAP)

            val similarity = FaceSDK.similarityCalculation(t1Bytes, t2Bytes)
            val res = Arguments.createMap()
            res.putDouble("similarity", similarity.toDouble())
            res.putDouble("scorePercent", (similarity * 100).toDouble())
            res.putBoolean("passed", similarity >= 0.75f)
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("SIMILARITY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getBestMatch(
        liveTemplateBase64: String,
        storedTemplates: ReadableArray,
        threshold: Double,
        promise: Promise
    ) {
        try {
            ensureInitialized()
            val liveBytes = Base64.decode(liveTemplateBase64, Base64.NO_WRAP)
            var bestScore = 0f
            var bestIndex = -1

            for (i in 0 until storedTemplates.size()) {
                val storedStr = storedTemplates.getString(i)
                if (storedStr != null && storedStr.isNotEmpty()) {
                    try {
                        val storedBytes = Base64.decode(storedStr, Base64.NO_WRAP)
                        val sim = FaceSDK.similarityCalculation(liveBytes, storedBytes)
                        if (sim > bestScore) {
                            bestScore = sim
                            bestIndex = i
                        }
                    } catch (e: Exception) {
                        // Skip invalid template
                    }
                }
            }

            val targetThreshold = if (threshold > 0) threshold.toFloat() else 0.75f
            val res = Arguments.createMap()
            res.putDouble("bestScore", (bestScore * 100).toDouble())
            res.putDouble("similarity", bestScore.toDouble())
            res.putInt("bestIndex", bestIndex)
            res.putBoolean("passed", bestScore >= targetThreshold)
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("MATCH_ERROR", e.message, e)
        }
    }

    private fun ensureInitialized() {
        if (!isInitialized) {
            val defaultKey = "dYSREvlnlNxuMwFlDCngsmkG5rFIck95ymNvkPDeTUXt3Cj7y0sFIoYIuv3rXaeCb6Imf7lbr7r09SsAPPPhL6oD1uCsdRqddQcMjzHThgjLBXjphSMnclb8SM8mzs/brmMZ+Ofu2p7nqKIy7zJASB3iRo2L5gy7ehNvKUy4bSyt7n7xCz8PrGWmBnphupYbQJLGU24RdVN1suybukqjZX5ctUUu2sDSd2CawEDH7ftLyoLuFrG1vYqExNq/FOhgBjzHgSmZ1tiZa+35rrU6kyzUG6O9Nl8A+Wr/lsV2QDjqn7iGgPmzimGL2pr7OLXJRUkOOWldWdetUeqohaI9eA=="
            var ret = FaceSDK.setActivation(defaultKey)
            if (ret == FaceSDK.SDK_SUCCESS) {
                FaceSDK.init(reactContext.assets)
                isInitialized = true
            }
        }
    }

    private fun getErrorMessage(code: Int): String {
        return when (code) {
            FaceSDK.SDK_LICENSE_KEY_ERROR -> "Invalid license key"
            FaceSDK.SDK_LICENSE_APPID_ERROR -> "App ID mismatch"
            FaceSDK.SDK_LICENSE_EXPIRED -> "License expired"
            FaceSDK.SDK_NO_ACTIVATED -> "SDK not activated"
            FaceSDK.SDK_INIT_ERROR -> "SDK init error"
            else -> "Unknown error ($code)"
        }
    }
}
