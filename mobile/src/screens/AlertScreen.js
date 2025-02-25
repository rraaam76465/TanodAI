// ... existing imports ...
import { DetectionAlert } from '../components/DetectionAlert';

export default function AlertScreen() {
  const [showAlert, setShowAlert] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  
  useEffect(() => {
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
          payload => {
            if (payload.new.ai_fire_detected || payload.new.flame_detected) {
              setCurrentAlert({
                ...payload.new,
                cameraName: `Camera ${payload.new.camera_id || 1}`,
                date: new Date(payload.new.timestamp * 1000).toLocaleDateString(),
                time: new Date(payload.new.timestamp * 1000).toLocaleTimeString(),
                onAcknowledge: () => handleSprinklerAction(payload.new.id, true),
                onIgnore: () => handleSprinklerAction(payload.new.id, false)
              });
              setShowAlert(true);
            }
          })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ... rest of your existing code ...

  return (
    <View style={styles.container}>
      {/* ... your existing UI ... */}
      
      <DetectionAlert
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        data={currentAlert}
        image={currentAlert?.image_url}
      />
    </View>
  );
}