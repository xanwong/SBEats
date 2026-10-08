import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import DecimalRatingRow from "../app/ratings/DecimalRatingRow";

jest.mock("@/components/themed-text", () => {
  const mockReact = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => mockReact.createElement(Text, props, children),
  };
});

jest.mock("@react-native-community/slider", () => {
  const mockReact = require("react");
  const { Pressable, Text } = require("react-native");
  return ({ onValueChange }: any) =>
    mockReact.createElement(
      Pressable,
      { testID: "mock-slider", onPress: () => onValueChange(7.26) },
      mockReact.createElement(Text, null, "MockSlider")
    );
});

describe("DecimalRatingRow", () => {
  it("renders label and formatted value", async () => {
    const { getByText } = await render(
      <DecimalRatingRow label="Food Quality" value={6} onChange={jest.fn()} />
    );

    expect(getByText("Food Quality")).toBeTruthy();
    expect(getByText("6.0")).toBeTruthy();
  });

  it("rounds slider updates to one decimal place before calling onChange", async () => {
    const onChange = jest.fn();

    const { getByTestId } = await render(
      <DecimalRatingRow label="Service" value={5} onChange={onChange} />
    );

    await fireEvent.press(getByTestId("mock-slider"));

    expect(onChange).toHaveBeenCalledWith(7.3);
  });
});
