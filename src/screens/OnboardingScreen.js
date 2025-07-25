import React, { useRef, useState } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, FlatList, Dimensions, StyleSheet } from 'react-native';
import styles from '../style/SplashScreenStyle';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    image: require('../assets/SplashScreen1.jpg'),
    quote: 'Empowering Farmers,\nEnriching Fields.',
  },
  {
    key: '2',
    image: require('../assets/SplashScreen2.jpg'),
    quote: 'Smart Choices,\nBetter Harvests.',
  },
  {
    key: '3',
    image: require('../assets/SplashScreen3.jpg'),
    quote: 'Farming the Future,\nToday.',
  },
];

const OnboardingScreen = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleContinue = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      if (onFinish) onFinish();
    }
  };

  const handleSkip = () => {
    if (onFinish) onFinish();
  };

  const renderItem = ({ item }) => (
    <View style={styles.fullScreen}>
      <ImageBackground
        source={item.image}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />
      </ImageBackground>
      <View style={styles.quoteContainer}>
        <Text style={styles.quote}>{item.quote}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.fullScreen}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={styles.bottomContainer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, currentIndex === idx && styles.activeDot]}
            />
          ))}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>{currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen; 