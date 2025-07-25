import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed to white to match CropScreen
  },
  scrollViewContent: {
    flexGrow: 1, // Use flexGrow for better scrolling
    paddingBottom: 80, // Add more padding to the bottom
  },
  header: {
    backgroundColor: '#6CAA64', // Updated to match CropScreen green
    paddingHorizontal: 20, // Consistent horizontal padding
    paddingTop: 50, // Sufficient space for status bar
    paddingBottom: 15, // Padding at the bottom of the header
    width: '100%',
  },
  plantPageText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weatherText: {
    color: '#1E3823',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 26, // Slightly larger font size
    fontWeight: '600', // Medium fontWeight for modern feel
    color: 'white', // White text for contrast on green header
    // marginLeft: 10, // Remove margin if no icon
  },
  locationIcon: {
     marginRight: 10, // Space between icon and text if used
     color: 'white', // White icon on green header
  },
  todayCard: {
    backgroundColor: 'white',
    borderRadius: 16, // Softer corners
    marginHorizontal: 15,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Slightly larger shadow offset
    shadowOpacity: 0.08, // More subtle shadow
    shadowRadius: 6, // Softer shadow radius
    elevation: 6, // for Android shadow
  },
  sectionTitle: {
    fontSize: 20, // Slightly larger section titles
    fontWeight: 'bold',
    marginBottom: 15, // More space below title
    color: '#6CAA64', // Updated to match CropScreen green
  },
  currentConditions: {
    fontSize: 15,
    color: '#6CAA64', // Updated to match CropScreen green
    marginBottom: 15,
  },
  currentWeatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 64, // Larger temperature font size
    fontWeight: '200', // Lighter fontWeight for large temp
    color: '#6CAA64', // Updated to match CropScreen green
  },
  weatherIcon: {
    width: 80, // Larger icon
    height: 80,
    color: '#6CAA64', // Updated to match CropScreen green
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Lighter gray to match CropScreen
    borderRadius: 12, // Softer corners
    paddingVertical: 15, // More vertical padding
    paddingHorizontal: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  detailTextContainer: {
    marginLeft: 10,
  },
  detailValue: {
    fontSize: 18, // Slightly larger value font size
    fontWeight: 'bold',
    color: '#6CAA64', // Updated to match CropScreen green
  },
  detailLabel: {
    fontSize: 11,
    color: '#777', // Gray to match CropScreen
    marginTop: 3, // More space between value and label
  },
  forecastCard: {
    backgroundColor: 'white',
    borderRadius: 16, // Softer corners
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 20, // Consistent horizontal padding
    paddingVertical: 15, // Adjusted vertical padding for the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  hourlyForecastContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20, // More space between items
  },
  hourlyTime: {
    fontSize: 13,
    color: '#777', // Updated to gray to match CropScreen
    marginBottom: 8, // More space below time
  },
  hourlyTemp: {
    fontSize: 18, // Slightly larger temp font size
    fontWeight: 'bold',
    marginTop: 8, // More space above temp
    color: '#6CAA64', // Updated to match CropScreen green
  },
  hourlyRain: {
    fontSize: 13,
    color: '#777', // Updated to gray to match CropScreen
    marginTop: 5,
  },
  dailyForecastContainer: {
    marginTop: 10,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Slightly less vertical padding for items within the card
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Light border
    justifyContent: 'space-between', // Restore space-between
  },
  dailyDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6CAA64', // Updated to match CropScreen green
    width: 80, // Restore fixed width
  },
  dailyRainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60, // Restore fixed width
    justifyContent: 'flex-end', // Align rain info to the right
    marginRight: 15, // Restore margin
  },
  dailyRain: {
    fontSize: 14,
    color: '#777', // Updated to gray to match CropScreen
    marginLeft: 5,
  },
  dailyTempHigh: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6CAA64', // Updated to match CropScreen green
    width: 50, // Restore fixed width
    textAlign: 'right',
    marginRight: 10, // Restore margin
  },
   dailyTempLow: {
    fontSize: 16,
    color: '#777', // Updated to gray to match CropScreen
    width: 50, // Restore fixed width
    textAlign: 'right',
     marginRight: 15, // Restore margin
  },
  dailyIcon: {
    width: 24,
    height: 24,
    color: '#6CAA64', // Updated to match CropScreen green
    marginLeft: 10, // Restore margin
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee', // Light border
    paddingVertical: 12, // More vertical padding
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, // Shadow at the top
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5, // Android elevation
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5, // Add some vertical padding
  },
  navLabel: {
    fontSize: 11, // Slightly larger label font size
    color: '#1B5E20', // Darker green label
    marginTop: 5,
  },
  activeNavItem: {
    backgroundColor: '#e8f5e9', // Very light green for active item background
    borderRadius: 24, // More rounded active item
    paddingVertical: 8, // More padding for active item
    paddingHorizontal: 15,
  },
  activeNavLabel: {
    color: '#1B5E20', // Darker green for active label
    fontWeight: '600', // Medium font weight
  },
   // Styles for additional sections (Wind, Dew Point, etc.)
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 15, // Added space above the grid
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '48%',
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  detailTitle: {
    fontSize: 14,
    color: '#558B2F', // A shade of green
    marginTop: 5,
    marginBottom: 5, // Added space below title
  },
  detailLargeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20', // Darker green
    marginTop: 5,
  },
  sunriseSunsetCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  graphPlaceholder: {
    height: 120, // Slightly taller placeholder
    backgroundColor: '#f0f4f8', // Softer background
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 15,
  },
  sunriseSunsetTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#558B2F', // A shade of green
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 18, // Slightly larger value
    fontWeight: 'bold',
    color: '#1B5E20', // Darker green
  },
  runningCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  runningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  runningStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20', // Darker green
    marginBottom: 5,
  },
  runningDescription: {
    fontSize: 14,
    color: '#558B2F', // A shade of green
    marginBottom: 15,
  },
  runningHourlyContainer: {
    marginTop: 10,
  },
  runningHourlyItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  runningHourlyTime: {
    fontSize: 12,
    color: '#558B2F', // A shade of green
    marginBottom: 5,
  },
  aqiCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  aqiStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20', // Darker green
    marginBottom: 10,
  },
  aqiBarPlaceholder: {
    height: 20,
    backgroundColor: '#e8f5e9', // Light green
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  humidityCardContainer: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 20,
    backgroundColor: 'white', // White background for the expanded card
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  historicalDataContainer: {
    marginTop: 20, // Space above the historical data section when expanded
  },
  historicalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', // Dark gray title
    marginBottom: 15,
  },
  historicalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555', // Medium gray section title
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Light border below section title
    paddingBottom: 5,
  },
  historicalHourlyContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  historicalHourlyItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  historicalHourlyTime: {
    fontSize: 12,
    color: '#555', // Medium gray time
    marginBottom: 5,
  },
  historicalHourlyTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333', // Dark gray temp
  },
  historicalHourlyRainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  historicalHourlyRain: {
    fontSize: 12,
    color: '#555', // Medium gray rain
    marginLeft: 2,
  },
  historicalDailyContainer: {
    marginTop: 10,
  },
  historicalDailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Light border
  },
  historicalDailyDay: {
    fontSize: 14,
    color: '#333', // Dark gray day
    flex: 2,
  },
  historicalDailyRainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginRight: 10,
  },
  historicalDailyRain: {
    fontSize: 12,
    color: '#555', // Medium gray rain
    marginLeft: 5,
  },
  historicalDailyTempHigh: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333', // Dark gray high temp
    flex: 1.5,
    textAlign: 'right',
    marginRight: 10,
  },
  historicalDailyTempLow: {
    fontSize: 14,
    color: '#555', // Medium gray low temp
    flex: 1.5,
    textAlign: 'right',
  },
  warningIcon: {
    marginLeft: 10,
  },
  directionIcon: {
    marginLeft: 10,
  },
});

export default styles; 