import { useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { resolveUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { COLORS } from "../components/Theme";

const { width, height } = Dimensions.get("window");

export default function VideoPostScreen({ route, navigation }) {
  const { videoUrl, username } = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const html = `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; display:flex; align-items:center; justify-content:center;
         height:100vh; overflow:hidden; position:relative; }
  video { width:100%; height:100%; object-fit:contain; }
  #soundBtn {
    position:fixed; bottom:30px; right:20px; z-index:999;
    width:48px; height:48px; border-radius:24px;
    background:rgba(0,0,0,0.55); display:flex; align-items:center;
    justify-content:center; font-size:22px; cursor:pointer;
    -webkit-tap-highlight-color:transparent; user-select:none;
    border:1px solid rgba(255,255,255,0.2);
  }
  #soundBtn:active { opacity:0.7; }
</style>
</head><body>
<video id="v" playsinline webkit-playsinline controls autoplay muted
       src="${resolveUrl(videoUrl)}" type="video/mp4"
       style="width:100%;height:100%;object-fit:contain"></video>
<div id="soundBtn">🔇</div>
<script>
  var v = document.getElementById('v');
  var muted = true;
  var sb = document.getElementById('soundBtn');
  sb.addEventListener('click', function() {
    muted = !muted;
    v.muted = muted;
    sb.textContent = muted ? '🔇' : '🔊';
    if (muted) { try { v.pause(); } catch(e) {} }
    else { try { v.play(); } catch(e) {} }
    window.ReactNativeWebView.postMessage('toggleSound:' + (muted ? 'off' : 'on'));
  });
  v.addEventListener('error', function(e) {
    window.ReactNativeWebView.postMessage('videoError:' + (v.error ? v.error.message : 'unknown'));
  });
  v.addEventListener('waiting', function() {
    window.ReactNativeWebView.postMessage('videoBuffering');
  });
  v.addEventListener('canplay', function() {
    window.ReactNativeWebView.postMessage('videoReady');
  });
  document.addEventListener('message', function(e) {
    if (e.data === 'mute') { muted = true; v.muted = true; try { v.pause(); } catch(ex) {} sb.textContent = '🔇'; }
    else if (e.data === 'unmute') { muted = false; v.muted = false; try { v.play(); } catch(ex) {} sb.textContent = '🔊'; }
  });
</script>
</body></html>`;

  const onMessage = useCallback((event) => {
    const data = event.nativeEvent?.data || "";
    if (data.startsWith("toggleSound:")) {
      setSoundOn(data.endsWith("on"));
    } else if (data.startsWith("videoError:")) {
      console.warn("Video error:", data.replace("videoError:", ""));
    }
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={s.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        onLoadEnd={() => setLoading(false)}
        onMessage={onMessage}
      />
      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>{t("loadingVideo")}</Text>
        </View>
      )}
      <View style={[s.topBar, { top: insets.top + 10 }]}>
        <TouchableOpacity style={s.closeBtn} onPress={() => { webViewRef.current?.postMessage("mute"); navigation.goBack(); }}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
        {username && <Text style={s.username}>{username}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { width, height },
  loadingOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  loadingText: { color: "#fff", marginTop: 12, fontSize: 14 },
  topBar: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, zIndex: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  username: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
