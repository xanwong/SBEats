/**
 * Reusable calendar component for selecting dates and managing scheduled visits.
 */
import { styles } from "./CalendarView.styles";
import { AppColor } from "@/constants/design";
import { getCalendarPalette } from "@/constants/calendar-theme";
import { ThemedView } from "@/components/themed-view";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { searchRestaurants } from "../utils/restaurantSearch";
import { auth, db } from "../firebaseconfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type EventItem = {
  id: string;
  date: string;
  title: string;
  time: string;
};

type PlanDoc = {
  date: string;
  title: string;
  time: string;
};

const toMinutes = (time: string) => {
  const [timePart, modifier] = time.split(" ");
  if (!timePart) return 0;

  let [hours, minutes] = timePart.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export default function CalendarView() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const theme = AppColor[colorScheme];
  const calendarPalette = getCalendarPalette(theme, isDark);
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate()
  );

  const [eventsByDate, setEventsByDate] = useState<
    Record<string, EventItem[]>
  >({});
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [timeValue, setTimeValue] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  useEffect(() => {
    let plansUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (plansUnsubscribe) {
        plansUnsubscribe();
        plansUnsubscribe = null;
      }

      if (!user) {
        setEventsByDate({});
        setIsLoadingPlans(false);
        return;
      }

      setIsLoadingPlans(true);
      const plansRef = collection(db, "users", user.uid, "plans");
      const plansQuery = plansRef;

      plansUnsubscribe = onSnapshot(
        plansQuery,
        (snapshot) => {
          const grouped: Record<string, EventItem[]> = {};

          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Partial<PlanDoc>;
            if (
              typeof data.date !== "string" ||
              typeof data.title !== "string" ||
              typeof data.time !== "string"
            ) {
              return;
            }

            if (!grouped[data.date]) grouped[data.date] = [];
            grouped[data.date].push({
              id: docSnap.id,
              date: data.date,
              title: data.title,
              time: data.time,
            });
          });

          setEventsByDate(grouped);
          setIsLoadingPlans(false);
        },
        (error) => {
          console.error("Failed to read plans:", error);
          setIsLoadingPlans(false);
        }
      );
    });

    return () => {
      if (plansUnsubscribe) plansUnsubscribe();
      authUnsubscribe();
    };
  }, []);

  const resetPlanForm = () => {
    setNewTitle("");
    setRestaurantQuery("");
    setSearchResults([]);
    setNewTime("");
    setShowTimePicker(false);
  };

  const handleCreatePlan = async () => {
    if (!selectedDay || !newTitle.trim() || !newTime) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not logged in", "Please log in again to save plans.");
      return;
    }

    setIsSavingPlan(true);
    const dateKey = getDateKey(selectedDay);

    try {
      await addDoc(collection(db, "users", user.uid, "plans"), {
        date: dateKey,
        title: newTitle.trim(),
        time: newTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      resetPlanForm();
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Failed to create plan:", error);
      Alert.alert("Error", "Could not save plan. Please try again.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = (event: EventItem) => {
    Alert.alert("Delete Plan", "Are you sure you want to delete this plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          const user = auth.currentUser;
          if (!user) return;

          try {
            await deleteDoc(doc(db, "users", user.uid, "plans", event.id));
          } catch (error) {
            console.error("Failed to delete plan:", error);
            Alert.alert("Error", "Could not delete plan. Please try again.");
          }
        },
      },
    ]);
  };

  const selectedEvents = selectedDay
    ? [...(eventsByDate[getDateKey(selectedDay)] || [])].sort(
      (a, b) => toMinutes(a.time) - toMinutes(b.time)
    )
    : [];

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <ThemedView style={styles.safe}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goToPrevMonth}>
            <Text style={[styles.navText, { color: theme.tint }]}>{"<"}</Text>
          </TouchableOpacity>

          <Text style={[styles.monthText, { color: calendarPalette.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>

          <TouchableOpacity onPress={goToNextMonth}>
            <Text style={[styles.navText, { color: theme.tint }]}>{">"}</Text>
          </TouchableOpacity>
        </View>

        {/* Weekdays */}
        <View style={styles.weekdays}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <Text key={d} style={[styles.weekdayText, { color: calendarPalette.mutedText }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((day, index) => {
                if (!day) return <View key={index} style={styles.cell} />;

                const key = getDateKey(day);
                const hasEvents = !!eventsByDate[key]?.length;
                const isSelected = day === selectedDay;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.cell}
                    onPress={() => setSelectedDay(day)}
                  >
                    <View style={styles.dayWrapper}>
                      <View
                        style={[
                          styles.dayCircle,
                          { backgroundColor: "transparent" },
                          isSelected && { backgroundColor: calendarPalette.selectedBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            { color: calendarPalette.text },
                            isSelected && { color: calendarPalette.selectedText },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>

                      <View style={styles.dotContainer}>
                        {hasEvents && <View style={[styles.eventDot, { backgroundColor: calendarPalette.dot }]} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Events Section */}
        <View style={styles.events}>
          <Text style={[styles.eventsTitle, { color: calendarPalette.text }]}>
            {selectedDay
              ? `Plans for ${MONTH_NAMES[month]} ${selectedDay}`
              : "Select a day"}
          </Text>

          <ScrollView>
            {isLoadingPlans ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : selectedDay && selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                  <View key={event.id} style={[styles.eventCardRow, { backgroundColor: calendarPalette.inputSurface, borderColor: calendarPalette.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: calendarPalette.text }]}>{event.title}</Text>
                      <Text style={[styles.eventTime, { color: calendarPalette.mutedText }]}>{event.time}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeletePlan(event)}
                    >
                      <Ionicons name="trash-outline" size={22} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))
            ) : (
              <Text style={[styles.noEventsText, { color: calendarPalette.mutedText }]}>
                No plans for this day
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Floating Add Button */}
        {selectedDay && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: calendarPalette.selectedBg }]}
            onPress={() => {
              resetPlanForm();
              setIsAddModalVisible(true);
            }}
          >
            <Text style={[styles.addButtonText, { color: calendarPalette.selectedText }]}>+</Text>
          </TouchableOpacity>
        )}

        {/* Add Plan Modal */}
        <Modal
          visible={isAddModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            resetPlanForm();
            setIsAddModalVisible(false);
          }}
        >
          <KeyboardAvoidingView
            style={[styles.modalOverlay, { backgroundColor: calendarPalette.overlay }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={[styles.modalContent, { backgroundColor: calendarPalette.surface }]}>

              <Text style={[styles.modalTitle, { color: calendarPalette.text }]}>
                Add Plan for {MONTH_NAMES[month]} {selectedDay}
              </Text>

              {/* Restaurant Search */}
              <TextInput
                placeholder="Search restaurant"
                value={restaurantQuery}
                onChangeText={(text) => {
                  setNewTitle(text);
                  setRestaurantQuery(text);
                  setSearchResults(text ? searchRestaurants(text) : []);
                }}
                onSubmitEditing={Keyboard.dismiss}
                returnKeyType="done"
                style={[styles.input, { borderColor: calendarPalette.border, backgroundColor: calendarPalette.inputSurface, color: calendarPalette.text }]}
                placeholderTextColor={calendarPalette.mutedText}
              />

              {searchResults.length > 0 && (
                <ScrollView
                  style={{ maxHeight: 150 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResults.slice(0,5).map((item: any) => (
                    <TouchableOpacity
                      key={item.url}
                      onPress={() => {
                        setNewTitle(item.name);
                        setRestaurantQuery(item.name);
                        setSearchResults([]);
                      }}
                      style={{ paddingVertical: 8 }}
                    >
                      <Text style={{ color: calendarPalette.text }}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Time Picker */}
              <TouchableOpacity
                style={[styles.input, { borderColor: calendarPalette.border, backgroundColor: calendarPalette.inputSurface }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: calendarPalette.text }}>{newTime || "Select time"}</Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={timeValue}
                  mode="time"
                  display="spinner"
                  themeVariant={isDark ? "dark" : "light"}
                  textColor={calendarPalette.text}
                  accentColor={theme.tint}
                  onChange={(_, date) => {
                    if (date) {
                      setTimeValue(date);
                      setNewTime(formatTime(date));
                    }
                  }}
                />
              )}

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    resetPlanForm();
                    setIsAddModalVisible(false);
                  }}
                >
                  <Text style={[styles.cancelText, { color: calendarPalette.mutedText }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreatePlan}
                  disabled={isSavingPlan}
                >
                  <Text style={[styles.saveText, { color: theme.tint }]}>
                    {isSavingPlan ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ThemedView>
  );
}
