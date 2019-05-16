import React, { Component } from "react";
import { Animated, Easing } from "react-native";

class FadeInImage extends Component {
  fade = new Animated.Value(0);

  componentDidMount() {
    const { uri } = this.props;
    if (uri) this.fadeIn();
  }

  fadeIn = () => {
    Animated.timing(this.fade, {
      duration: 300,
      easing: Easing.sin,
      toValue: 1,
      useNativeDriver: true
    }).start();
  };

  render() {
    const { uri, style, blurRadius } = this.props;
    if (!uri) return null;
    return (
      <Animated.Image
        style={[style, { opacity: this.fade }]}
        source={{ uri }}
        blurRadius={blurRadius}
      />
    );
  }
}

export default FadeInImage;
