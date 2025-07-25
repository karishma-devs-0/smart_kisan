import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  contentContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  quoteContainer: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    width: width,
    alignSelf: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  quote: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 60,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d3d3d3',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#6BA06B',
    width: 40,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: width * 0.85,
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#6BA06B',
    borderRadius: 24,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  skipButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fullScreen: {
        flex: 1,
        width,
        height,
        backgroundColor: '#222',
      },
      
});


