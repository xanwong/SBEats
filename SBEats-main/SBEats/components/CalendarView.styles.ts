/**
 * Styling definitions for the CalendarView component.
 */
import { StyleSheet } from "react-native";
import { Radius, Spacing, Typography } from "@/constants/design";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  monthText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  navText: {
    fontSize: Typography.size.xl,
    paddingHorizontal: Spacing.md,
  },
  weekdays: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  calendar: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  dayWrapper: {
    alignItems: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: Typography.size.md,
  },
  dotContainer: {
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4285F4",
  },
  events: {
    flex: 1,
    marginTop: Spacing.md,
  },
  eventsTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.sm,
  },
  eventCard: {
    backgroundColor: "#F2F2F2",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  eventTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  eventTime: {
    marginTop: 4,
    color: "#666",
  },
  noEventsText: {
    color: "#888",
    marginTop: Spacing.md,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    padding: Spacing.xl,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
  },
  saveText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F2F2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
});
