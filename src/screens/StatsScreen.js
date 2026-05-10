import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getStatsSummary, getTopUsers, getLogsForReport } from '../api';

export default function StatsScreen() {
  const [summary, setSummary] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el Reporte PDF
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); // 'start' o 'end'

  const cargarEstadisticas = async () => {
    setRefreshing(true);
    const sum = await getStatsSummary();
    const top = await getTopUsers();
    setSummary(sum);
    setTopUsers(top);
    setRefreshing(false);
  };

  useEffect(() => { cargarEstadisticas(); }, []);

  // Función constructora del PDF
  const generarPDF = async () => {
    if (startDate > endDate) {
      Alert.alert("Error", "La fecha de inicio no puede ser mayor a la fecha final.");
      return;
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // 1. Pedimos los datos al servidor
    const datosReporte = await getLogsForReport(startStr, endStr);
    
    if (datosReporte.length === 0) {
      Alert.alert("Sin Datos", "No hay registros en este rango de fechas para generar el reporte.");
      return;
    }

    // 2. Construimos las filas de la tabla en HTML
    let tableRows = '';
    datosReporte.forEach(log => {
      const fecha = new Date(log.created_at).toLocaleString('es-ES');
      const colorEstado = log.is_unlocked ? 'color: #4CAF50;' : 'color: #F44336;';
      const textoEstado = log.is_unlocked ? 'DESBLOQUEADO' : 'BLOQUEADO';
      
      tableRows += `
        <tr>
          <td>${fecha}</td>
          <td>${log.first_name} ${log.last_name}</td>
          <td>Candado #${log.lock_id}</td>
          <td style="${colorEstado} font-weight: bold;">${textoEstado}</td>
        </tr>
      `;
    });

    // 3. Plantilla HTML profesional (Similar a la que te generé arriba)
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            p { margin: 5px 0; font-size: 14px; }
            .rango { margin-top: 20px; font-size: 16px; font-weight: bold; color: #1976D2; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f8ff; color: #1976D2; text-align: left; padding: 12px; font-size: 14px; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Master Tronics</h1>
            <p>Auditoría Oficial del Sistema</p>
          </div>
          <div class="rango">
            Período: ${startDate.toLocaleDateString()} hasta ${endDate.toLocaleDateString()}
          </div>
          <table>
            <tr>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Candado</th>
              <th>Estado</th>
            </tr>
            ${tableRows}
          </table>
          <div class="footer">Documento generado automáticamente por la aplicación Master Tronics.</div>
        </body>
      </html>
    `;

    try {
      // 4. Creamos el archivo PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      // 5. Abrimos el menú nativo del celular para compartir/guardar
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo generar el documento PDF.");
    }
  };

  const formatearFecha = (fecha) => fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Componente visual de tarjeta pequeña
  const StatCard = ({ title, value, icon, color }) => (
    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ backgroundColor: color + '20', padding: 10, borderRadius: 10, marginRight: 15 }}>
        <MaterialCommunityIcons name={icon} size={30} color={color} />
      </View>
      <View>
        <Text style={{ color: '#666', fontSize: 14 }}>{title}</Text>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F5F5F5' }}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={cargarEstadisticas} />}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Análisis de Datos</Text>

      {/* SECCIÓN DE RESUMEN ESTADÍSTICO */}
      {summary && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 7 }}>
              <StatCard title="Hoy" value={summary.today_logs} icon="calendar-check" color="#4CAF50" />
            </View>
            <View style={{ flex: 1, marginLeft: 7 }}>
              <StatCard title="Usuarios" value={summary.total_users} icon="account-group" color="#2196F3" />
            </View>
          </View>
          <StatCard title="Total Registros" value={summary.total_logs} icon="database" color="#673AB7" />
        </>
      )}

      {/* NUEVA SECCIÓN: AUDITORÍA EN PDF */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 15 }}>Exportar Auditoría (PDF)</Text>
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 15, elevation: 2, marginBottom: 25 }}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          {/* Selector Fecha Inicio */}
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Desde:</Text>
            <TouchableOpacity onPress={() => setShowPicker('start')} style={{ backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{formatearFecha(startDate)}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Selector Fecha Fin */}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Hasta:</Text>
            <TouchableOpacity onPress={() => setShowPicker('end')} style={{ backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{formatearFecha(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Nativo del Calendario */}
        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(null);
              if (selectedDate) {
                if (showPicker === 'start') setStartDate(selectedDate);
                else setEndDate(selectedDate);
              }
            }}
          />
        )}

        <TouchableOpacity 
          onPress={generarPDF} 
          style={{ backgroundColor: '#FF9800', padding: 15, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" style={{ marginRight: 10 }} />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Generar Reporte PDF</Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN TOP USUARIOS */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Usuarios más Activos</Text>
      {topUsers.map((user, index) => (
        <View key={index} style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#333' }}>{index + 1}. {user.first_name} {user.last_name}</Text>
          <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
            <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{user.activity_count} usos</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}