package com.eveninglight.attendance

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

import com.eveninglight.attendance.kbyface.KbyFaceSDKPackage
import com.kbyai.facesdk.FaceSDK

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(KbyFaceSDKPackage())
        }
    )
  }

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    // Pre-initialize KBY-AI FaceSDK
    try {
      val activationKey = "dYSREvlnlNxuMwFlDCngsmkG5rFIck95ymNvkPDeTUXt3Cj7y0sFIoYIuv3rXaeCb6Imf7lbr7r09SsAPPPhL6oD1uCsdRqddQcMjzHThgjLBXjphSMnclb8SM8mzs/brmMZ+Ofu2p7nqKIy7zJASB3iRo2L5gy7ehNvKUy4bSyt7n7xCz8PrGWmBnphupYbQJLGU24RdVN1suybukqjZX5ctUUu2sDSd2CawEDH7ftLyoLuFrG1vYqExNq/FOhgBjzHgSmZ1tiZa+35rrU6kyzUG6O9Nl8A+Wr/lsV2QDjqn7iGgPmzimGL2pr7OLXJRUkOOWldWdetUeqohaI9eA=="
      val ret = FaceSDK.setActivation(activationKey)
      if (ret == FaceSDK.SDK_SUCCESS) {
        FaceSDK.init(assets)
        println("[KbyFaceSDK] Native FaceSDK initialized successfully!")
      } else {
        println("[KbyFaceSDK] FaceSDK setActivation failed with code: $ret")
      }
    } catch (e: Exception) {
      println("[KbyFaceSDK] Error initializing FaceSDK: ${e.message}")
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
