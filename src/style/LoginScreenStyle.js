import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: '#e8f5e9', // Light green background for the whole screen
  },
  topContainer: {
    width: '100%',
    // Let content dictate height
    justifyContent: 'flex-end', // Align content to bottom of top container
    alignItems: 'center',
    paddingBottom: 20, // Add some padding below the logo/subtitle
    paddingTop: height * 0.08, // Adjusted padding at the top based on image
  },
  logo: {
    width: width * 0.60, // Slightly smaller logo based on image
    height: width * 0.60, // Maintain aspect ratio
    marginBottom: 0, // Reduced margin to place SmartKisan text closer
  },
  logoTitleText: {
    fontSize: 24, // Adjust font size as needed
    fontWeight: 'bold', // Adjust font weight as needed
    color: '#222', // Changed color to green
    marginBottom: 3, // Reduced space between SmartKisan and Precision Agriculture
    textTransform: 'uppercase', // Make all letters capital
  },
  logoSubtitle: {
    fontSize: 12, // Slightly smaller font size based on image
    color: '#222', // Changed color to green
    marginTop: 0,
    // fontWeight: 'bold', // Make subtitle bold for better contrast/look
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25, // Increased horizontal padding based on image
    paddingTop: 35, // Increased padding at the top of the card
    paddingBottom: 40, // Add padding for content below buttons
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25, // Increased margin below tabs
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabText: {
    fontSize: 15, // Slightly smaller font size
    paddingBottom: 10,
    color: '#888',
    fontWeight: '500', // Medium weight based on image
  },
  activeTabText: {
    color: '#6BA06B',
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    height: 2,
    backgroundColor: '#6BA06B',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabIndicator: {
    height: 2,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputLabel: {
    fontSize: 13, // Smaller font size for labels
    color: '#555',
    marginBottom: 5,
    marginTop: 15, // Increased margin above label
  },
  input: {
    height: 48, // Slightly shorter input fields
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    marginRight: 10,
  },
   flagPlaceholder: {
    width: 20,
    height: 14,
    backgroundColor: '#ccc', // Placeholder color for flag
    marginRight: 5,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 5,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#555',
    marginLeft: 5,
  },
  phoneNumberInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 48, // Match height of other inputs
  },
   otpInput: {
    flex: 1,
    height: 48, // Match height of container
    fontSize: 16,
  },
  eyeIconContainer: {
    paddingLeft: 10,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25, // Increased margin below links
    marginTop: 5, // Added margin above links
  },
  linkText: {
    color: '#6BA06B',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#6BA06B',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15, // Added margin above register link
  },
  registerText: {
    fontSize: 14,
    color: '#888',
  },
  registerLink: {
    fontSize: 14,
    color: '#6BA06B',
    fontWeight: 'bold',
  },
}); 