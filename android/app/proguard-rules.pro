# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# op-sqlite
-keep class com.op.sqlite.** { *; }

# react-native-pdf
-keep class com.github.nickhurst.rn.pdf.** { *; }

# react-native-vector-icons
-keep class com.oblador.vectoricons.** { *; }

# react-native-blob-util
-keep class com.ReactNativeBlobUtil.** { *; }

# General
-keepattributes *Annotation*
-keepclassmembers class ** { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class ** { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-dontwarn com.facebook.react.**
