import { StyleSheet, Platform, StatusBar } from 'react-native';
//Este archivo es para los codigos de colores, fuentes, etc. que se vayan a usar en la app, para no tener todo el codigo en App.js y que sea mas facil de leer y mantener.

export const COLORS = {
  primary: '#0056b3',
  secondary: '#6c757d',
  success: '#4CAF50',
  danger: '#F44336',
  background: '#FFFFFF',
  surface: '#f9f9f9',
  text: '#000000',
  textLight: '#666666',
};

export const styles = StyleSheet.create({
  // ... tus otros estilos ...
  container: {
    flex: 1, 
    backgroundColor: '#fff',
    marginBottom:10,
  },
  content: {
    padding: 20, 
    gap: 15,     
  },
  title: { 
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    fontWeight: 'bold',
  },
headerContainer: {
    flexDirection: 'row',     
    alignItems: 'center',      
    justifyContent: 'center',  
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 10,  
    borderBottomRightRadius: 10,
    backgroundColor: '#fff',
  },
  headerSectionLeft: {
    flex: 1,                  
    alignItems: 'flex-start',  
  },
  headerSectionCenter: {
    flex: 2,                  
    alignItems: 'center',      
  },
  headerSectionRight: {
    flex: 1,                 
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',      
  },
  lockContainer: {
    alignItems: 'center',
    gap: 20,
  },
  lockedImage: {
    width: 200,
    height: 200,
  },
  titlesToLeft: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  verticalSeparator: {
    marginVertical: 20,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  }
});
