import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { FileSystem } from "expo";
import FadeInImage from "./FadeInImage";

const CACHE_DIR = `${FileSystem.cacheDirectory}turbo-expo-image/`;

export async function clearCache() {
  await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(CACHE_DIR);
}

class TurboImage extends Component {
  state = {
    imageLoading: false,
    error: null,
    imageUri: null,
    thumbLoading: false,
    thumbError: null,
    thumbUri: null
  };

  mounted = true;

  componentDidMount() {
    this.startLoading();
  }

  componentDidUpdate(prevProps) {
    const { uri } = this.props;
    if (prevProps.uri !== uri) this.startLoading();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  safeSetState = newState => {
    if (this.mounted) this.setState(newState);
  };

  startLoading = () => {
    const { uri, thumb } = this.props;
    if (uri)
      if (/^file:\/\//.test(uri)) {
        this.safeSetState({ imageLoading: false, error: null, imageUri: uri });
      } else {
        this.loadImage({
          uri: uri.replace(/ /gi, "+"), // THIS IS A TEMPORARY PATCH!!! TODO: ADDRESS B/E URL BUG
          onExists: uri =>
            this.safeSetState({
              imageLoading: false,
              error: null,
              imageUri: uri
            }),
          onStart: () => {
            this.safeSetState({ imageLoading: true });
            if (thumb)
              this.loadImage({
                uri: thumb.replace(/ /gi, "+"), // THIS IS A TEMPORARY PATCH!!! TODO: ADDRESS B/E URL BUG
                onStart: () => this.safeSetState({ thumbLoading: true }),
                onExists: uri =>
                  this.safeSetState({
                    thumbLoading: false,
                    error: null,
                    thumbUri: uri
                  }),
                onLoaded: uri =>
                  this.safeSetState({
                    thumbLoading: false,
                    error: null,
                    thumbUri: uri
                  }),
                onError: error =>
                  this.safeSetState({
                    thumbLoading: false,
                    error,
                    imageUri: null
                  })
              });
          },
          onLoaded: uri =>
            this.safeSetState({
              imageLoading: false,
              error: null,
              imageUri: uri
            }),
          onError: error =>
            this.safeSetState({ imageLoading: false, error, imageUri: null })
        });
      }
  };

  async uriToName(uri) {
    const filename = uri.substring(
      uri.lastIndexOf("/"),
      uri.indexOf("?") === -1 ? uri.length : uri.indexOf("?")
    );
    const ext =
      filename.indexOf(".") === -1
        ? ".jpg"
        : filename.substring(filename.lastIndexOf("."));
    const hash = uri
      .substring(uri.indexOf("://") > -1 ? uri.indexOf("://") + 3 : 0)
      .replace(/\/|\?|\&| |:| |\\|\./gi, "");
    const path = `${CACHE_DIR}${hash}${ext}`;

    try {
      await FileSystem.makeDirectoryAsync(CACHE_DIR);
    } catch (e) {}
    return path;
  }

  async loadImage({ onStart, onExists, onLoaded, onError, uri }) {
    //onStart
    onStart();
    try {
      const file = await this.uriToName(uri);
      const cached = await FileSystem.getInfoAsync(file);

      if (cached.exists) {
        // file exists in cache
        // onLoaded
        onExists(cached.uri);
      } else {
        // file does not exist in cache so download it
        const res = await FileSystem.downloadAsync(uri, file);
        if (res && res.status === 200) {
          onLoaded(res.uri);
        } else {
          console.log("TURBO EXPO IMAGE ERROR", uri, res);
          onError(res.status);
        }
      }
    } catch (error) {
      onError(error);
      console.log("TURBO EXPO IMAGE ERROR!", uri, error);
    }
  }

  render() {
    const { imageUri, thumbUri } = this.state;
    const { style, children } = this.props;

    return (
      <View style={[style, turboImageStyles.placeholder]}>
        <FadeInImage
          uri={thumbUri}
          style={[style, turboImageStyles.thumb]}
          blurRadius={15}
          key={thumbUri + "thumb"}
        />
        <FadeInImage
          uri={imageUri}
          style={[style, turboImageStyles.thumb]}
          key={imageUri + "image"}
        />
        {children}
      </View>
    );
  }
}

const turboImageStyles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#f7f7f7",
    padding: 0
  },
  thumb: {
    position: "absolute"
  }
});

export default TurboImage;
