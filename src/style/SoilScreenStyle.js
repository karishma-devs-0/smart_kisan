import { StyleSheet, Dimensions } from \'react-native\';\n\nconst { width, height } = Dimensions.get(\'window\');\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: \'#f0f0f0\',\n  },\n  scrollViewContent: {\n    flexGrow: 1,\n  },\n  header: {\n    backgroundColor: \'#669966\',\n    padding: 20,\n    paddingTop: 40,\n    width: \'100%\',\n  },\n  headerText: {\n    fontSize: 24,\n    fontWeight: \'bold\',\n    color: \'white\',\n    textAlign: \'center\',\n  },\n  detailCard: {\n    backgroundColor: \'white\',\n    borderRadius: 10,\n    marginHorizontal: 15,\n    marginTop: 20,\n    padding: 15,\n    shadowColor: \'#000\',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 3,\n  },\n  sectionTitle: {\n    fontSize: 18,\n    fontWeight: \'bold\',\n    marginBottom: 10,\n    color: \'#333\',\n  },\n  detailText: {\n    fontSize: 16,\n    color: \'#555\',\n  },\n  contentCard: {\n    backgroundColor: \'white\',\n    borderRadius: 10,\n    marginHorizontal: 15,\n    marginTop: 15,\n    padding: 15,\n    flexDirection: \'row\',\n    alignItems: \'center\',\n    shadowColor: \'#000\',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 3,\n  },\n  textContent: {\n    flex: 1,\n    marginRight: 10,\n  },\n  currentMoisture: {\n    fontSize: 16,\n    fontWeight: \'bold\',\n    color: \'#333\',\n    marginBottom: 5,\n  },\n  moistureDescription: {\n    fontSize: 14,\n    color: \'#555\',\n  },\
  plantImage: {\n    width: 80,\n    height: 80,\n    borderRadius: 10,\n  },\
  graphCard: {\n    backgroundColor: \'white\',\n    borderRadius: 10,\n    marginHorizontal: 15,\n    marginTop: 15,\n    marginBottom: 20,\n    padding: 15,\n    shadowColor: \'#000\',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 3,\n  },\
  graphHeader: {\n    flexDirection: \'row\',\n    justifyContent: \'space-between\',\n    alignItems: \'center\',\n    marginBottom: 10,\n  },\
  dailyAverage: {\n    fontSize: 14,\n    color: \'#555\',\n  },\
  graphPlaceholder: {\n    height: 150,\n    backgroundColor: \'#eee\',\
    justifyContent: \'center\',\
    alignItems: \'center\',\
  },\
  bottomNav: {\n    flexDirection: \'row\',\
    justifyContent: \'space-around\',\
    alignItems: \'center\',\
    backgroundColor: \'white\',\
    borderTopWidth: 1,\
    borderTopColor: \'#eee\',\
    paddingVertical: 10,\
  },\
  navItem: {\n    flex: 1,\
    alignItems: \'center\',\
    paddingVertical: 5,\
  },\
  navLabel: {\n    fontSize: 10,\
    color: \'#555\',\
    marginTop: 5,\
  },\
});\n\nexport default styles; 