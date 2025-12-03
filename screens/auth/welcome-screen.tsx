import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';

import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { BrandLogo } from '@/components/atoms/brand-logo';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AuthStackParamList } from '@/navigation/types';

export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 'splash',
    type: 'splash',
  },
  {
    id: '1',
    type: 'content',
    image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=800&q=80',
    title: 'Empowering Your Dreams',
    description: 'Seamless loan tracking and management at your fingertips. Keep smiling and meet your needs with quick loans.',
  },
  {
    id: '2',
    type: 'content',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    title: 'Education & Growth',
    description: 'Helps you cover not only the expenses towards your course fees but also your future aspirations.',
  },
  {
    id: '3',
    type: 'content',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=800&q=80',
    title: 'Stress-Free Process',
    description: 'No stress with payments and loan process. Upload evidence and track status instantly.',
  },
];

export const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  const theme = useAppTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('MobileInput');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    if (item.type === 'splash') {
      return (
        <LinearGradient
          colors={['#7C3AED', '#4C1D95']}
          style={styles.slide}
        >
          <View style={styles.splashContent}>
            <View style={styles.logoContainer}>
                {/* Placeholder for the hexagon logo if BrandLogo isn't exactly it, but using BrandLogo for consistency */}
                <BrandLogo size={120} align="center" />
            </View>
            <AppText style={styles.splashText}>NIDHISETU</AppText>
          </View>
           <TouchableOpacity style={styles.splashButton} onPress={handleNext}>
              <AppIcon name="arrow-right" size={24} color="#FFF" />
            </TouchableOpacity>
        </LinearGradient>
      );
    }

    return (
      <View style={styles.slide}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['#7C3AED', '#2E1065']}
          style={styles.contentContainer}
        >
            {/* Curved top effect via border radius */}
          <View style={styles.textWrapper}>
             <View style={styles.pagination}>
                {slides.filter(s => s.type === 'content').map((_, idx) => {
                    // Adjust index because splash is 0
                    const active = (currentIndex - 1) === idx; 
                    return (
                        <View 
                            key={idx} 
                            style={[
                                styles.dot, 
                                { backgroundColor: active ? '#FFF' : 'rgba(255,255,255,0.3)' }
                            ]} 
                        />
                    );
                })}
            </View>

            <AppText style={styles.title}>{item.title}</AppText>
            <AppText style={styles.description}>{item.description}</AppText>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <AppIcon name="arrow-right" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialNumToRender={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  splashText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  splashButton: {
      position: 'absolute',
      bottom: 50,
      right: 30,
      width: 56,
      height: 56,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  image: {
    width: width,
    height: height * 0.65, // Image takes top 65%
    position: 'absolute',
    top: 0,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.45, // Content overlaps image slightly
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40, // Rounded corners for "wave" feel
    paddingHorizontal: 32,
    paddingTop: 40,
    justifyContent: 'flex-start',
  },
  textWrapper: {
      flex: 1,
      alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  nextButton: {
    position: 'absolute',
    bottom: 50,
    right: 0, // Aligned to right side of container padding
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
