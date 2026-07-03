import React from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';

// WebView-backed YouTube player for live broadcasts + archived VODs. The video
// is streamed by YouTube; DiskRider's chat/gift/tip overlays render outside it.
//
// Native deps (add + EAS/dev build — will NOT work in Expo Go):
//   npx expo install react-native-youtube-iframe react-native-webview

interface Props {
  videoId: string;
  height?: number;
  play?: boolean;
}

const YouTubePlayer: React.FC<Props> = ({ videoId, height = 240, play = true }) => (
  <View style={[styles.wrap, { height }]}>
    <YoutubeIframe
      height={height}
      play={play}
      videoId={videoId}
      webViewProps={{ allowsInlineMediaPlayback: true }}
      initialPlayerParams={{ rel: false, modestbranding: true }}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#000', width: '100%' },
});

export default YouTubePlayer;
