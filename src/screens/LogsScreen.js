import { View, Text } from 'react-native';

const LogsScreen = () => { // <--- Asegúrate que diga 'export default'
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Aquí irán los registros de acceso</Text>
    </View>
  );
}

export default LogsScreen;