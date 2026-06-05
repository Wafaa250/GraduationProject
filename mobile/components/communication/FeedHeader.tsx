import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getMe } from "@/api/meApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { FeedSearchModal } from "@/components/communication/FeedSearchModal";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { getItem } from "@/utils/authStorage";

type Props = {
  onSearchActiveChange?: (active: boolean) => void;
};

export function FeedHeader({ onSearchActiveChange }: Props) {
  const layout = useResponsiveLayout();
  const [displayName, setDisplayName] = useState("Student");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const me = await getMe();
      setDisplayName(me.name?.trim() || "Student");
      setAvatarBase64(me.profilePictureBase64 ?? null);
    } catch {
      const storedName = await getItem("name");
      if (storedName) setDisplayName(storedName);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const avatarSize = layout.scale(40);
  const iconSize = layout.iconSize;

  const openSearch = () => {
    setSearchOpen(true);
    onSearchActiveChange?.(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    onSearchActiveChange?.(false);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.space("sm"),
            paddingBottom: layout.space("md"),
            gap: layout.space("md"),
          },
        ]}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.push("/dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={8}
          >
            {loadingProfile ? (
              <View style={[styles.avatarPlaceholder, { width: avatarSize, height: avatarSize }]}>
                <ActivityIndicator size="small" color={HUB_COLORS.primary} />
              </View>
            ) : (
              <FeedAvatar
                name={displayName}
                size={avatarSize}
                avatarBase64={profilePhotoUrl(avatarBase64) ? avatarBase64 : null}
                roleType="student"
              />
            )}
          </Pressable>

          <View style={[styles.searchWrap, { borderRadius: layout.radius.input }]}>
            <Ionicons name="search" size={iconSize} color={HUB_COLORS.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={openSearch}
              placeholder="Search people, companies..."
              placeholderTextColor={HUB_COLORS.muted}
              style={[styles.searchInput, { fontSize: layout.fontSize.body }]}
              returnKeyType="search"
              onSubmitEditing={openSearch}
            />
          </View>

          <Pressable
            onPress={() => router.push("/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            style={styles.notifBtn}
          >
            <Ionicons name="notifications-outline" size={iconSize + 2} color={HUB_COLORS.foreground} />
          </Pressable>
        </View>
      </View>

      <FeedSearchModal
        visible={searchOpen}
        initialQuery={searchQuery}
        onClose={closeSearch}
        onQueryChange={setSearchQuery}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: HUB_COLORS.background,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: HUB_COLORS.primarySoft,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: HUB_COLORS.inputBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: HUB_COLORS.foreground,
    padding: 0,
  },
  notifBtn: {
    padding: 4,
  },
});
