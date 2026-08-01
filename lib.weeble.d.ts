/**
 * The global API for Discord events, commands, and supported guild resources.
 * No import is required in a Weeble script.
 *
 * ### Event-Driven Runtime
 * Your code registers handlers for gateway events, prefix commands, or slash
 * commands. Events arrive from the Discord Gateway. Weeble awaits each handler
 * in registration order for a dispatched event. See `discord.on()` for the event list.
 *
 * ### Data on arrival, fetches when you need them
 * Every object (messages, members, channels, roles, …) arrives with its data
 * already populated from the event payload. Methods like `.fetch()`, `.fetchGuild()`,
 * `.fetchChannel()`, `.fetchMember()` make API calls on demand. Prefer the data you
 * already have. Extra fetches are slower.
 *
 * ```ts
 * discord.on(discord.events.MESSAGE_CREATE, async (msg) => {
 *   if (msg.content === '!ping') {
 *     await msg.reply('pong');
 *   }
 * });
 * ```
 *
 * ### API calls are abstracted into methods
 * There is no direct access to the Discord REST API. Every mutation (sending a message,
 * editing a role, kicking a member, banning a user) is a method on the relevant
 * handle. Discord requests pass through Weeble's rate limiter and may wait
 * before being sent.
 *
 * ```ts
 * discord.on(discord.events.GUILD_MEMBER_ADD, async (member) => {
 *   const channel = await discord.fetchGuildTextChannel('welcome-channel-id');
 *   if (!channel) return console.warn('Welcome channel is missing or is not a text channel.');
 *   await channel.send(`Welcome ${member.toMention()}`);
 * });
 * ```
 *
 * @see https://docs.discord.com/developers/events/gateway
 * @see https://docs.discord.com/developers/reference
 */
declare namespace discord {
  /**
   * A Discord snowflake ID.
   * Snowflakes are 64-bit unsigned integers encoded as a string of digits. Every
   * Discord resource (users, messages, channels, guilds, …) has a unique snowflake
   * that embeds its creation timestamp, worker ID, and increment.
   *
   * Keep snowflakes as strings. JavaScript numbers cannot precisely represent every
   * valid Discord snowflake.
   *
   * #### Example
   * ```ts
   * const channel = await discord.fetchGuildTextChannel('1504537312841961583');
   * ```
   *
   * @see https://docs.discord.com/developers/reference#snowflakes
   */
  type Snowflake = string;

  /**
   * Discord localization map keyed by locale code, such as `"en-US"`, `"fr"`, or `"ar"`.
   */
  type LocaleMap = Record<string, string>;

  /**
   * Convenience alias for a single Discord permission value.
   * Permissions are expressed as bitmask values (see {@link PermissionFlags}).
   * Combine multiple flags with `|` and check membership with `&`.
   */
  type PermissionFlag = bigint;

  /**
   * Implemented by types that can be rendered as a Discord mention string.
   * Users, channels, roles, and other Discord entities implement this interface
   * so they can be included in message content as clickable mentions.
   *
   * @see https://docs.discord.com/developers/reference#message-formatting
   */
  interface Mentionable {
    /**
     * Returns the Discord mention syntax for this object.
     * The format varies by entity type:
     * - User: `<@userId>`
     * - Channel: `<#channelId>`
     * - Role: `<@&roleId>`
     *
     * @returns A mention string suitable for embedding in message content.
     */
    toMention(): string;
  }

  /**
   * Describes an emoji used in message content or reactions.
   * Covers both custom guild emoji (identified by snowflake) and standard
   * Unicode emoji (identified by the emoji string as the name).
   */
  interface EmojiData {
    /**
     * Indicates whether this custom emoji is animated.
     */
    animated?: boolean;

    /**
     * Custom emoji ID, or null for unicode emoji.
     */
    id?: string | null;

    /**
     * Custom emoji name, or the Unicode emoji string.
     */
    name: string;
  }

  /**
   * Controls which mentions in a message are delivered as notifications.
   * If omitted, the endpoint's Discord defaults apply. A role or user type
   * cannot appear in `parse` when explicit IDs for that type are supplied.
   *
   * #### Example
   * ```ts
   * await message.reply({
   *   content: `Hello ${message.author.toMention()}`,
   *   allowedMentions: { users: [message.author.id], parse: [] },
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/resources/message#allowed-mentions-object
   */
  type AllowedMentions = { repliedUser?: boolean } & (
    | {
        parse?: "everyone"[];
        roles?: Snowflake[];
        users?: Snowflake[];
      }
    | {
        parse: Array<"roles" | "everyone">;
        roles?: never;
        users?: Snowflake[];
      }
    | {
        parse: Array<"users" | "everyone">;
        roles?: Snowflake[];
        users?: never;
      }
    | {
        parse: Array<"roles" | "users" | "everyone">;
        roles?: never;
        users?: never;
      }
  );

  /**
   * Raw file data to upload as a message attachment.
   * Supply the binary content as an `ArrayBuffer` along with a display name.
   * The optional MIME type lets you override Discord's auto-detection.
   */
  interface AttachmentInput {
    /**
     * MIME type of the file. When omitted Discord attempts to detect it.
     */
    contentType?: string;

    /**
     * Raw binary data of the file.
     */
    data: ArrayBuffer;

    /**
     * The file name visible to recipients.
     */
    fileName: string;

    /**
     * Indicates whether the attachment should be marked as a spoiler.
     */
    spoiler?: boolean;
  }

  /**
   * A file attached to a message.
   * Read-only metadata describing an attachment that already exists on Discord.
   * For uploading new files use {@link AttachmentInput} instead.
   */
  interface Attachment {
    /**
     * MIME type of the file, or null when unknown.
     */
    contentType: string | null;

    /** Alternative text shown for this attachment, or `null` when unset. */
    description: string | null;

    /**
     * Indicates whether this attachment is ephemeral (only visible to the interaction user).
     */
    ephemeral: boolean;

    /** Discord attachment flag bitfield. */
    flags: number;

    /**
     * File name as uploaded.
     */
    filename: string;

    /**
     * Height of the image in pixels, or null for non-image attachments.
     */
    height: number | null;

    /**
     * The unique ID for this attachment.
     */
    id: Snowflake;

    /** Whether Discord marks this attachment as a spoiler. */
    isSpoiler: boolean;

    /**
     * Proxied CDN URL for the attachment.
     */
    proxyUrl: string;

    /**
     * Size of the file in bytes.
     */
    size: number;

    /**
     * CDN URL for the attachment.
     */
    url: string;

    /**
     * Width of the image in pixels, or null for non-image attachments.
     */
    width: number | null;
  }

  /**
   * A file attachment that may be either raw input data or a previously uploaded attachment.
   * Use this type when an API accepts both new uploads and references to
   * existing attachments (e.g. when editing a message).
   */
  type AttachmentLike = AttachmentInput | Attachment;

  /** Metadata that can be changed while retaining an existing attachment. */
  interface AttachmentEdit {
    id: Snowflake;
    description?: string | null;
    isSpoiler?: boolean;
  }

  /**
   * A single selectable option within a slash-command argument.
   * When the user picks a choice, Discord sends the corresponding value
   * to your handler rather than the display name.
   */
  interface CommandChoice {
    /**
     * Display name of the choice visible to the user.
     */
    name: string;

    /**
     * Localized display names keyed by Discord locale code.
     */
    nameLocalizations?: LocaleMap;

    /**
     * Underlying value sent when the user picks this choice.
     */
    value: string | number;
  }

  /**
   * A reference to another message, used when replying.
   * `messageId` identifies the message being replied to. `channelId` and `guildId`
   * may be omitted when replying in the same channel/guild.
   */
  interface MessageReference {
    /**
     * ID of the channel.
     */
    channelId?: Snowflake;

    /**
     * Whether Discord should reject the reply if the referenced message no longer exists.
     */
    failIfNotExists?: boolean;

    /**
     * ID of the guild.
     */
    guildId?: Snowflake;

    /**
     * ID of the referenced message.
     */
    messageId: Snowflake;
  }

  /**
   * Permission flags represented as `bigint` bit values.
   * Combine flags with `|`, and test a permission with `member.can(...)` or a
   * bitwise `&` check. `ADMINISTRATOR` implicitly grants every permission.
   *
   * @see https://docs.discord.com/developers/topics/permissions
   */
  const PermissionFlags: {
    readonly ADD_REACTIONS: bigint;
    readonly ADMINISTRATOR: bigint;
    readonly ATTACH_FILES: bigint;
    readonly BAN_MEMBERS: bigint;
    readonly BYPASS_SLOWMODE: bigint;
    readonly CHANGE_NICKNAME: bigint;
    readonly CONNECT: bigint;
    readonly CREATE_EVENTS: bigint;
    readonly CREATE_GUILD_EXPRESSIONS: bigint;
    readonly CREATE_INSTANT_INVITE: bigint;
    readonly CREATE_PRIVATE_THREADS: bigint;
    readonly CREATE_PUBLIC_THREADS: bigint;
    readonly DEAFEN_MEMBERS: bigint;
    readonly EMBED_LINKS: bigint;
    readonly KICK_MEMBERS: bigint;
    readonly MANAGE_CHANNELS: bigint;
    readonly MANAGE_EVENTS: bigint;
    readonly MANAGE_GUILD: bigint;
    readonly MANAGE_GUILD_EXPRESSIONS: bigint;
    readonly MANAGE_EMOJIS_AND_STICKERS: bigint;
    readonly MANAGE_MESSAGES: bigint;
    readonly MANAGE_NICKNAMES: bigint;
    readonly MANAGE_ROLES: bigint;
    readonly MANAGE_THREADS: bigint;
    readonly MANAGE_WEBHOOKS: bigint;
    readonly MENTION_EVERYONE: bigint;
    readonly MODERATE_MEMBERS: bigint;
    readonly MOVE_MEMBERS: bigint;
    readonly MUTE_MEMBERS: bigint;
    readonly NONE: 0n;
    readonly PIN_MESSAGES: bigint;
    readonly PRIORITY_SPEAKER: bigint;
    readonly READ_MESSAGE_HISTORY: bigint;
    readonly REQUEST_TO_SPEAK: bigint;
    readonly SEND_MESSAGES: bigint;
    readonly SEND_MESSAGES_IN_THREADS: bigint;
    readonly SEND_POLLS: bigint;
    readonly SEND_TTS_MESSAGES: bigint;
    readonly SEND_VOICE_MESSAGES: bigint;
    readonly SET_VOICE_CHANNEL_STATUS: bigint;
    readonly SPEAK: bigint;
    readonly STREAM: bigint;
    readonly USE_APPLICATION_COMMANDS: bigint;
    readonly USE_EMBEDDED_ACTIVITIES: bigint;
    readonly USE_EXTERNAL_EMOJIS: bigint;
    readonly USE_EXTERNAL_SOUNDS: bigint;
    readonly USE_EXTERNAL_APPS: bigint;
    readonly USE_EXTERNAL_STICKERS: bigint;
    readonly USE_SOUNDBOARD: bigint;
    readonly USE_VAD: bigint;
    readonly VIEW_AUDIT_LOG: bigint;
    readonly VIEW_CHANNEL: bigint;
    readonly VIEW_GUILD_INSIGHTS: bigint;
    readonly VIEW_CREATOR_MONETIZATION_ANALYTICS: bigint;
  };

  /**
   * Numeric channel type values sent by Discord.
   * Use these values to narrow a {@link Channel} before accessing type-specific fields.
   *
   * @see https://docs.discord.com/developers/resources/channel#channel-object-channel-types
   */
  const ChannelType: {
    readonly ANNOUNCEMENT_THREAD: 10;
    readonly GUILD_ANNOUNCEMENT: 5;
    readonly GUILD_CATEGORY: 4;
    readonly GUILD_DIRECTORY: 14;
    readonly GUILD_FORUM: 15;
    readonly GUILD_MEDIA: 16;
    readonly GUILD_STAGE_VOICE: 13;
    readonly GUILD_TEXT: 0;
    readonly GUILD_VOICE: 2;
    readonly PRIVATE_THREAD: 12;
    readonly PUBLIC_THREAD: 11;
  };

  /**
   * Union of numeric Discord channel type values.
   */
  type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

  /**
   * Numeric activity type values used in presence payloads.
   *
   * @see https://docs.discord.com/developers/events/gateway-events#activity-object-activity-types
   */
  const ActivityType: {
    readonly COMPETING: 5;
    readonly CUSTOM: 4;
    readonly LISTENING: 2;
    readonly PLAYING: 0;
    readonly STREAMING: 1;
    readonly WATCHING: 3;
  };

  /**
   * Union of numeric Discord activity type values.
   */
  type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

  /**
   * Numeric action values recorded in guild audit log entries.
   * Each value identifies the operation that produced an {@link AuditLogEntry}.
   *
   * @see https://docs.discord.com/developers/resources/audit-log#audit-log-entry-object-audit-log-events
   */
  const AuditLogActionType: {
    readonly APPLICATION_COMMAND_PERMISSION_UPDATE: 121;
    readonly AUTO_MODERATION_BLOCK_MESSAGE: 143;
    readonly AUTO_MODERATION_FLAG_TO_CHANNEL: 144;
    readonly AUTO_MODERATION_QUARANTINE_USER: 146;
    readonly AUTO_MODERATION_RULE_CREATE: 140;
    readonly AUTO_MODERATION_RULE_DELETE: 142;
    readonly AUTO_MODERATION_RULE_UPDATE: 141;
    readonly AUTO_MODERATION_USER_COMMUNICATION_DISABLED: 145;
    readonly BOT_ADD: 28;
    readonly CHANNEL_CREATE: 10;
    readonly CHANNEL_DELETE: 12;
    readonly CHANNEL_OVERWRITE_CREATE: 13;
    readonly CHANNEL_OVERWRITE_DELETE: 15;
    readonly CHANNEL_OVERWRITE_UPDATE: 14;
    readonly CHANNEL_UPDATE: 11;
    readonly CREATOR_MONETIZATION_REQUEST_CREATED: 150;
    readonly CREATOR_MONETIZATION_TERMS_ACCEPTED: 151;
    readonly EMOJI_CREATE: 60;
    readonly EMOJI_DELETE: 62;
    readonly EMOJI_UPDATE: 61;
    readonly GUILD_SCHEDULED_EVENT_CREATE: 100;
    readonly GUILD_SCHEDULED_EVENT_DELETE: 102;
    readonly GUILD_SCHEDULED_EVENT_UPDATE: 101;
    readonly GUILD_UPDATE: 1;
    readonly HOME_SETTINGS_CREATE: 190;
    readonly HOME_SETTINGS_UPDATE: 191;
    readonly INTEGRATION_CREATE: 80;
    readonly INTEGRATION_DELETE: 82;
    readonly INTEGRATION_UPDATE: 81;
    readonly INVITE_CREATE: 40;
    readonly INVITE_DELETE: 42;
    readonly INVITE_UPDATE: 41;
    readonly MEMBER_BAN_ADD: 22;
    readonly MEMBER_BAN_REMOVE: 23;
    readonly MEMBER_DISCONNECT: 27;
    readonly MEMBER_KICK: 20;
    readonly MEMBER_MOVE: 26;
    readonly MEMBER_PRUNE: 21;
    readonly MEMBER_ROLE_UPDATE: 25;
    readonly MEMBER_UPDATE: 24;
    readonly MESSAGE_BULK_DELETE: 73;
    readonly MESSAGE_DELETE: 72;
    readonly MESSAGE_PIN: 74;
    readonly MESSAGE_UNPIN: 75;
    readonly ONBOARDING_CREATE: 166;
    readonly ONBOARDING_PROMPT_CREATE: 163;
    readonly ONBOARDING_PROMPT_DELETE: 165;
    readonly ONBOARDING_PROMPT_UPDATE: 164;
    readonly ONBOARDING_UPDATE: 167;
    readonly ROLE_CREATE: 30;
    readonly ROLE_DELETE: 32;
    readonly ROLE_UPDATE: 31;
    readonly SOUNDBOARD_SOUND_CREATE: 130;
    readonly SOUNDBOARD_SOUND_UPDATE: 131;
    readonly SOUNDBOARD_SOUND_DELETE: 132;
    readonly STAGE_INSTANCE_CREATE: 83;
    readonly STAGE_INSTANCE_DELETE: 85;
    readonly STAGE_INSTANCE_UPDATE: 84;
    readonly STICKER_CREATE: 90;
    readonly STICKER_DELETE: 92;
    readonly STICKER_UPDATE: 91;
    readonly THREAD_CREATE: 110;
    readonly THREAD_DELETE: 112;
    readonly THREAD_UPDATE: 111;
    readonly VOICE_CHANNEL_STATUS_CREATE: 192;
    readonly VOICE_CHANNEL_STATUS_DELETE: 193;
    readonly WEBHOOK_CREATE: 50;
    readonly WEBHOOK_DELETE: 52;
    readonly WEBHOOK_UPDATE: 51;
  };

  /**
   * Union of numeric Discord audit log action values.
   */
  type AuditLogActionType =
    (typeof AuditLogActionType)[keyof typeof AuditLogActionType];

  /**
   * File format variants supported by Discord stickers.
   */
  const StickerFormatType: {
    readonly APNG: 2;
    readonly GIF: 4;
    readonly LOTTIE: 3;
    readonly PNG: 1;
  };

  /**
   * Union of numeric Discord sticker format values.
   */
  type StickerFormatType =
    (typeof StickerFormatType)[keyof typeof StickerFormatType];

  /**
   * Target type for a channel permission overwrite.
   */
  const PermissionOverwriteType: {
    readonly MEMBER: 1;
    readonly ROLE: 0;
  };

  /**
   * Union of channel permission overwrite target types.
   */
  type PermissionOverwriteType =
    (typeof PermissionOverwriteType)[keyof typeof PermissionOverwriteType];

  /**
   * Numeric webhook type values returned by Discord.
   */
  const WebhookType: {
    readonly APPLICATION: 3;
    readonly CHANNEL_FOLLOWER: 2;
    readonly INCOMING: 1;
  };

  /**
   * Union of numeric Discord webhook type values.
   */
  type WebhookType = (typeof WebhookType)[keyof typeof WebhookType];

  /**
   * Events that can trigger an auto moderation rule.
   */
  const AutoModEventType: {
    readonly MESSAGE_SEND: 1;
  };

  /**
   * Union of auto moderation event type values.
   */
  type AutoModEventType =
    (typeof AutoModEventType)[keyof typeof AutoModEventType];

  /**
   * Types of triggers an auto moderation rule can use.
   */
  const AutoModTriggerType: {
    readonly HARMFUL_LINK: 2;
    readonly KEYWORD: 1;
    readonly KEYWORD_PRESET: 4;
    readonly MEMBER_PROFILE: 6;
    readonly MENTION_SPAM: 5;
    readonly SPAM: 3;
  };

  /**
   * Union of auto moderation trigger type values.
   */
  type AutoModTriggerType =
    (typeof AutoModTriggerType)[keyof typeof AutoModTriggerType];

  /**
   * Actions an auto moderation rule can take when triggered.
   */
  const AutoModActionType: {
    readonly BLOCK_MEMBER_INTERACTION: 4;
    readonly BLOCK_MESSAGE: 1;
    readonly SEND_ALERT_MESSAGE: 2;
    readonly TIMEOUT: 3;
  };

  /**
   * Union of auto moderation action type values.
   */
  type AutoModActionType =
    (typeof AutoModActionType)[keyof typeof AutoModActionType];

  /**
   * Numeric interaction type values received from Discord.
   *
   * @see https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object-interaction-type
   */
  const InteractionType: {
    readonly APPLICATION_COMMAND: 2;
    readonly APPLICATION_COMMAND_AUTOCOMPLETE: 4;
    readonly MESSAGE_COMPONENT: 3;
    readonly MODAL_SUBMIT: 5;
    readonly PING: 1;
  };

  /**
   * Union of numeric Discord interaction type values.
   */
  type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

  /**
   * Numeric component type values used in messages and modals.
   * Not every component is valid in every surface; message and modal builders
   * enforce the supported shapes when sent.
   *
   * @see https://docs.discord.com/developers/components/reference
   */
  const ComponentType: {
    readonly ACTION_ROW: 1;
    readonly BUTTON: 2;
    readonly CHANNEL_SELECT: 8;
    readonly CHECKBOX: 23;
    readonly CHECKBOX_GROUP: 22;
    readonly CONTAINER: 17;
    readonly FILE: 13;
    readonly FILE_UPLOAD: 19;
    readonly LABEL: 18;
    readonly MEDIA_GALLERY: 12;
    readonly MENTIONABLE_SELECT: 7;
    readonly RADIO_GROUP: 21;
    readonly ROLE_SELECT: 6;
    readonly SECTION: 9;
    readonly SEPARATOR: 14;
    readonly STRING_SELECT: 3;
    readonly TEXT_DISPLAY: 10;
    readonly TEXT_INPUT: 4;
    readonly THUMBNAIL: 11;
    readonly USER_SELECT: 5;
  };

  /**
   * Union of numeric Discord component type values.
   */
  type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

  /**
   * Numeric style values accepted by button components.
   */
  const ButtonStyle: {
    readonly DANGER: 4;
    readonly LINK: 5;
    readonly PRIMARY: 1;
    readonly SECONDARY: 2;
    readonly SUCCESS: 3;
  };

  /**
   * Union of numeric Discord button style values.
   */
  type ButtonStyle = (typeof ButtonStyle)[keyof typeof ButtonStyle];

  /**
   * Numeric style values accepted by modal text inputs.
   */
  const TextInputStyle: {
    readonly PARAGRAPH: 2;
    readonly SHORT: 1;
  };

  /**
   * Union of numeric Discord text input style values.
   */
  type TextInputStyle = (typeof TextInputStyle)[keyof typeof TextInputStyle];

  /**
   * Bitmask flags that describe properties of a message.
   *
   * @see https://docs.discord.com/developers/resources/message#message-object-message-flags
   */
  const MessageFlags: {
    readonly CROSSPOSTED: 1;
    readonly EPHEMERAL: 64;
    readonly FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 256;
    readonly HAS_THREAD: 32;
    readonly IS_COMPONENTS_V2: 32768;
    readonly IS_CROSSPOST: 2;
    readonly IS_VOICE_MESSAGE: 8192;
    readonly LOADING: 128;
    readonly SOURCE_MESSAGE_DELETED: 8;
    readonly SUPPRESS_EMBEDS: 4;
    readonly SUPPRESS_NOTIFICATIONS: 4096;
    readonly URGENT: 16;
  };

  /**
   * Union of Discord message flag bit values.
   */
  type MessageFlags = (typeof MessageFlags)[keyof typeof MessageFlags];

  /** Bitmask flags that describe an attachment. */
  const AttachmentFlags: {
    readonly IS_CLIP: 1;
    readonly IS_THUMBNAIL: 2;
    readonly IS_REMIX: 4;
    readonly IS_SPOILER: 8;
    readonly IS_ANIMATED: 32;
  };

  type AttachmentFlags = (typeof AttachmentFlags)[keyof typeof AttachmentFlags];

  /**
   * Numeric message type values describing how a message was produced.
   *
   * @see https://docs.discord.com/developers/resources/message#message-object-message-types
   */
  const MessageType: {
    readonly AUTO_MODERATION_ACTION: 24;
    readonly CALL: 3;
    readonly CHANNEL_FOLLOW_ADD: 12;
    readonly CHANNEL_ICON_CHANGE: 5;
    readonly CHANNEL_NAME_CHANGE: 4;
    readonly CHANNEL_PINNED_MESSAGE: 6;
    readonly CHAT_INPUT_COMMAND: 20;
    readonly CONTEXT_MENU_COMMAND: 23;
    readonly DEFAULT: 0;
    readonly GUILD_APPLICATION_PREMIUM_SUBSCRIPTION: 32;
    readonly GUILD_BOOST: 8;
    readonly GUILD_BOOST_TIER_1: 9;
    readonly GUILD_BOOST_TIER_2: 10;
    readonly GUILD_BOOST_TIER_3: 11;
    readonly GUILD_DISCOVERY_DISQUALIFIED: 14;
    readonly GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING: 17;
    readonly GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: 16;
    readonly GUILD_DISCOVERY_REQUALIFIED: 15;
    readonly GUILD_INCIDENT_ALERT_MODE_DISABLED: 37;
    readonly GUILD_INCIDENT_ALERT_MODE_ENABLED: 36;
    readonly GUILD_INCIDENT_REPORT_FALSE_ALARM: 39;
    readonly GUILD_INCIDENT_REPORT_RAID: 38;
    readonly GUILD_INVITE_REMINDER: 22;
    readonly INTERACTION_PREMIUM_UPSELL: 26;
    readonly RECIPIENT_ADD: 1;
    readonly RECIPIENT_REMOVE: 2;
    readonly REPLY: 19;
    readonly ROLE_SUBSCRIPTION_PURCHASE: 25;
    readonly STAGE_END: 28;
    readonly STAGE_RAISE_HAND: 30;
    readonly STAGE_SPEAKER: 29;
    readonly STAGE_START: 27;
    readonly STAGE_TOPIC: 31;
    readonly THREAD_CREATED: 18;
    readonly THREAD_STARTER_MESSAGE: 21;
    readonly USER_JOIN: 7;
  };

  /**
   * Union of numeric Discord message type values.
   */
  type MessageType = (typeof MessageType)[keyof typeof MessageType];

  /**
   * Privacy levels for scheduled events.
   */
  const ScheduledEventPrivacyLevel: {
    readonly GUILD_ONLY: 2;
  };

  /**
   * Union of scheduled event privacy level values.
   */
  type ScheduledEventPrivacyLevel =
    (typeof ScheduledEventPrivacyLevel)[keyof typeof ScheduledEventPrivacyLevel];

  /**
   * Types of entities a scheduled event can be associated with.
   */
  const ScheduledEventEntityType: {
    readonly EXTERNAL: 3;
    readonly STAGE_INSTANCE: 1;
    readonly VOICE: 2;
  };

  /**
   * Union of scheduled event entity type values.
   */
  type ScheduledEventEntityType =
    (typeof ScheduledEventEntityType)[keyof typeof ScheduledEventEntityType];

  /**
   * Status values for a scheduled event's lifecycle.
   */
  const ScheduledEventStatus: {
    readonly ACTIVE: 2;
    readonly CANCELED: 4;
    readonly COMPLETED: 3;
    readonly SCHEDULED: 1;
  };

  /**
   * Union of scheduled event status values.
   */
  type ScheduledEventStatus =
    (typeof ScheduledEventStatus)[keyof typeof ScheduledEventStatus];

  /**
   * Privacy levels for stage instances.
   */
  const StageInstancePrivacyLevel: {
    readonly GUILD_ONLY: 2;
    readonly PUBLIC: 1;
  };

  /**
   * Union of stage instance privacy level values.
   */
  type StageInstancePrivacyLevel =
    (typeof StageInstancePrivacyLevel)[keyof typeof StageInstancePrivacyLevel];

  /**
   * Namespace containing errors thrown by the Discord SDK runtime.
   */
  namespace errors {
    /**
     * Base error for a Discord API request that could not be completed.
     * Inspect the error message for Discord's response details.
     */
    class DiscordError extends RuntimeError {
      readonly code: number;
      readonly status: number | null;
      constructor(message: string, code?: number, status?: number | null);
    }

    /**
     * Error thrown when the bot lacks the required permissions to perform an action.
     */
    class PermissionError extends DiscordError {
      constructor(message?: string, code?: number);
    }

    /**
     * Error thrown when the bot is being rate limited by Discord. The request can be retried after `retryAfter` seconds.
     */
    class RateLimitError extends DiscordError {
      /**
       * Indicates whether this is a global rate limit affecting all requests.
       */
      global: boolean;

      /**
       * How long to wait before retrying, in seconds.
       */
      retryAfter: number;

      constructor(
        message: string,
        retryAfter: number,
        global?: boolean,
        code?: number,
      );
    }

    /**
     * Base error for failures surfaced by the Weeble runtime.
     */
    class RuntimeError extends Error {
      constructor(message: string);
    }

    /**
     * Error thrown when Discord returns a 5xx server error.
     */
    class ServerError extends DiscordError {
      readonly status: number;
      constructor(message: string, status: number, code?: number);
    }
  }

  /**
   * Author information for an embed. Used with `EmbedBuilder.setAuthor()`.
   */
  interface EmbedAuthorData {
    /**
     * URL of the author icon.
     */
    iconUrl?: string;

    /**
     * Author name displayed in the embed.
     */
    name: string;

    /**
     * URL the author name links to.
     */
    url?: string;
  }

  /**
   * Footer information for an embed. Used with `EmbedBuilder.setFooter()`.
   */
  interface EmbedFooterData {
    /**
     * URL of the footer icon.
     */
    iconUrl?: string;

    /**
     * Footer text content.
     */
    text: string;
  }

  /**
   * Media (image/video) attachment data for an embed.
   */
  interface EmbedMediaData {
    /**
     * Display height in pixels.
     */
    height?: number;

    /**
     * Direct URL to the media file.
     */
    url: string;

    /**
     * Display width in pixels.
     */
    width?: number;
  }

  /**
   * A named field displayed in an embed body.
   */
  interface EmbedFieldData {
    /**
     * Indicates whether the field should be rendered inline with adjacent inline fields.
     */
    inline?: boolean;

    /**
     * Field name (bold heading).
     */
    name: string;

    /**
     * Field value (body text).
     */
    value: string;
  }

  /**
   * Builder class for constructing rich embed objects. Use the method-chaining API to build, then pass `toJSON()` result or the builder itself to send/edit methods.
   *
   * #### Example
   * ```ts
   * const embed = new discord.EmbedBuilder()
   *   .setTitle('Server status')
   *   .setDescription('All systems operational.')
   *   .setColor(0x57f287);
   * ```
   *
   * @see https://docs.discord.com/developers/resources/message#embed-object
   */
  class EmbedBuilder {
    /**
     * Append a single field.
     *
     * @param name The field name (bold heading).
     * @param value The field value (body text, supports Markdown).
     * @param inline Whether the field should render inline with adjacent inline fields.
     * @returns The builder instance for chaining.
     */
    addField(name: string, value: string, inline?: boolean): EmbedBuilder;

    /**
     * Append one or more field data objects.
     *
     * @param fields One or more EmbedFieldData objects to append.
     * @returns The builder instance for chaining.
     */
    addFields(...fields: EmbedFieldData[]): EmbedBuilder;

    /**
     * Remove all fields from the embed.
     */
    clearFields(): EmbedBuilder;

    /**
     * Create an EmbedBuilder from a raw embed object (e.g. from a stored template).
     *
     * @param data Raw embed data object.
     * @returns A new EmbedBuilder populated with the given data.
     */
    static from(data: Record<string, unknown>): EmbedBuilder;

    /**
     * Set the author section with name, optional URL, and optional icon.
     *
     * @param author Object containing the author name, and optionally a URL and icon URL.
     * @returns The builder instance for chaining.
     */
    setAuthor(author: EmbedAuthorData): EmbedBuilder;

    /**
     * Set the sidebar color as a 24-bit RGB integer (e.g. `0xFF0000` for red).
     *
     * @param color 24-bit RGB color value.
     * @returns The builder instance for chaining.
     */
    setColor(color: number): EmbedBuilder;

    /**
     * Set the embed description.
     *
     * @param description The description text (supports Markdown).
     * @returns The builder instance for chaining.
     */
    setDescription(description: string): EmbedBuilder;

    /**
     * Set the footer with text and optional icon.
     *
     * @param footer Object containing footer text and optionally an icon URL.
     * @returns The builder instance for chaining.
     */
    setFooter(footer: EmbedFooterData): EmbedBuilder;

    /**
     * Set the main image. Accepts a URL string or a media data object.
     *
     * @param image Direct URL string, or a media data object with url, height, and width.
     * @returns The builder instance for chaining.
     */
    setImage(image: string | EmbedMediaData): EmbedBuilder;

    /**
     * Set the thumbnail in the top-right corner. Accepts a URL string or a media data object.
     *
     * @param thumbnail Direct URL string, or a media data object with url, height, and width.
     * @returns The builder instance for chaining.
     */
    setThumbnail(thumbnail: string | EmbedMediaData): EmbedBuilder;

    /**
     * Set the timestamp displayed in the embed footer. Defaults to now when no argument is provided.
     *
     * @param timestamp A Date object or Unix timestamp (ms). Omit to use the current time.
     * @returns The builder instance for chaining.
     */
    setTimestamp(timestamp?: Date | number): EmbedBuilder;

    /**
     * Set the embed title.
     *
     * @param title The title text to display at the top of the embed.
     * @returns The builder instance for chaining.
     */
    setTitle(title: string): EmbedBuilder;

    /**
     * Set a URL the embed title links to.
     *
     * @param url The URL to open when the title is clicked.
     * @returns The builder instance for chaining.
     */
    setURL(url: string): EmbedBuilder;

    /**
     * Serialize the builder to a plain object ready for Discord's API.
     *
     * @returns A plain object suitable for sending to Discord's API.
     */
    toJSON(): Record<string, unknown>;
  }

  /**
   * A read-only embed from a received message. All properties are immutable copies of the Discord embed data.
   */
  class Embed {
    /**
     * Author information, or `null` if not set.
     */
    readonly author: {
      iconUrl: string | null;
      name: string;
      url: string | null;
    } | null;

    /**
     * 24-bit RGB sidebar color, or `null` if not set.
     */
    readonly color: number | null;

    /**
     * Description text, or `null` if not set.
     */
    readonly description: string | null;

    /**
     * Array of field objects displayed in the embed body.
     */
    readonly fields: Array<{
      inline: boolean;
      name: string;
      value: string;
    }>;

    /**
     * Footer information, or `null` if not set.
     */
    readonly footer: {
      iconUrl: string | null;
      text: string;
    } | null;

    /**
     * Main image, or `null` if not set.
     */
    readonly image: {
      height: number | null;
      proxyUrl: string | null;
      url: string;
      width: number | null;
    } | null;

    /**
     * Thumbnail image, or `null` if not set.
     */
    readonly thumbnail: {
      height: number | null;
      proxyUrl: string | null;
      url: string;
      width: number | null;
    } | null;

    /**
     * ISO-8601 timestamp displayed in the footer, or `null` if not set.
     */
    readonly timestamp: Date | null;

    /**
     * Title of the embed, or `null` if not set.
     */
    readonly title: string | null;

    /**
     * URL the title links to, or `null` if not set.
     */
    readonly url: string | null;
  }
  interface EmbedData {
    /**
     * Embed author block.
     */
    author?: EmbedAuthorData;

    /**
     * 24-bit RGB color value.
     */
    color?: number;

    /**
     * Description text.
     */
    description?: string;

    /**
     * Embed fields displayed in the body.
     */
    fields?: EmbedFieldData[];

    /**
     * Embed footer block.
     */
    footer?: EmbedFooterData;

    /**
     * Embed image media.
     */
    image?: EmbedMediaData;

    /**
     * Embed thumbnail media.
     */
    thumbnail?: EmbedMediaData;

    /**
     * Timestamp displayed by Discord.
     */
    timestamp?: string | Date;

    /**
     * Embed title text.
     */
    title?: string;

    /**
     * URL used by Discord for this field.
     */
    url?: string;
  }

  /**
   * Embed input accepted by message send and edit methods.
   */
  type EmbedLike = EmbedBuilder | EmbedData;

  /**
   * A poll attached to a message, including its choices, vote counts, expiration, and finalization state.
   */
  class Poll {
    /** ID of the channel containing this poll, or `null` when the poll is not attached to a message. */
    readonly channelId: Snowflake | null;

    /** ID of the message containing this poll, or `null` when the poll is not attached to a message. */
    readonly messageId: Snowflake | null;
    /**
     * Indicates whether members can select multiple answers.
     */
    readonly allowMultiselect: boolean;

    /**
     * Array of answer options with their vote counts.
     */
    readonly answers: Array<{
      answerId: number;
      count: number;
      meVoted: boolean;
      text: string;
    }>;

    /**
     * When the poll expires, or `null` if no expiration is set.
     */
    readonly expiration: Date | null;

    /**
     * Underlying Discord poll layout type identifier.
     */
    readonly layoutType: number;

    /**
     * The question prompt for this poll.
     */
    readonly question: {
      text: string;
    };

    /**
     * Aggregated results, or `null` when Discord omitted them.
     */
    readonly results: {
      answerCounts: Array<{ id: number; count: number }>;
      isFinalized: boolean;
    } | null;

    /**
     * Get the total number of votes cast across all answers.
     *
     * @returns The sum of votes, or `null` when Discord omitted poll results.
     */
    getTotalVotes(): number | null;

    /**
     * Get the vote count for a specific answer ID.
     *
     * @param answerId The numeric ID of the answer choice.
     * @returns The answer's vote count, or `null` when Discord omitted poll results.
     */
    getVoteCount(answerId: number): number | null;

    /** Fetch users who voted for one answer. */
    fetchVoters(
      answerId: number,
      options?: { after?: Snowflake; limit?: number },
    ): Promise<User[]>;

    /**
     * Indicates whether the poll results are finalized (no more voting).
     *
     * @returns `true` if the poll results have been published and voting has ended.
     */
    isFinalized(): boolean;
  }

  /**
   * Message fields accepted by send and reply methods.
   */
  interface SendMessageOptions {
    /**
     * Mention parsing rules for this message.
     */
    allowedMentions?: AllowedMentions;

    /**
     * Existing attachments to keep or include.
     */
    attachments?: Attachment[];

    /**
     * Components to include with the message.
     */
    components?: Component[];

    /**
     * Message content.
     */
    content?: string;

    /**
     * Embeds to include with the message.
     */
    embeds?: EmbedLike[];

    /**
     * New files to upload.
     */
    files?: AttachmentInput[];

    /**
     * Discord bitfield flags.
     */
    flags?: number;

    /**
     * Poll to create with the message.
     */
    poll?: PollCreateOptions;

    /**
     * Message reference used to create a reply.
     */
    reply?: MessageReference;

    /**
     * Sticker IDs to attach to the message.
     */
    stickerIds?: Snowflake[];

    /**
     * Whether to send the message using text-to-speech.
     */
    tts?: boolean;
  }

  /**
   * Configuration for a poll attached to a new message.
   */
  interface PollCreateOptions {
    /**
     * Indicates whether members can select multiple answers.
     */
    allowMultiselect?: boolean;

    /**
     * Answer choices. Discord accepts between 2 and 10 answers.
     */
    answers: string[];

    /**
     * Duration in hours. Discord accepts whole numbers from 1 through 768.
     */
    duration: number;

    /**
     * The question text for the poll.
     */
    question: string;
  }

  /**
   * Message fields accepted when editing an existing message.
   */
  interface EditMessageOptions {
    /**
     * Mention parsing rules for this message.
     */
    allowedMentions?: AllowedMentions;

    /**
     * Existing attachments to keep or include.
     */
    attachments?: AttachmentEdit[];

    /**
     * Components to include with the message.
     */
    components?: Component[];

    /**
     * Message content.
     */
    content?: string;

    /**
     * Embeds to include with the message.
     */
    embeds?: EmbedLike[];

    /**
     * New files to upload.
     */
    files?: AttachmentInput[];

    /**
     * Discord bitfield flags.
     */
    flags?: number;
  }

  /**
   * Message fields accepted when executing a webhook, including per-request identity overrides.
   */
  interface WebhookExecuteOptions extends SendMessageOptions {
    /**
     * Override the webhook avatar for this execution.
     */
    avatarUrl?: string;

    /**
     * Override the webhook username for this execution.
     */
    username?: string;
  }

  /**
   * Pagination controls for retrieving messages from a channel.
   */
  interface FetchMessagesOptions {
    /**
     * Fetch messages after this ID (newer messages).
     */
    after?: Snowflake;

    /**
     * Fetch messages around this ID (centered pagination).
     */
    around?: Snowflake;

    /**
     * Fetch messages before this ID (older messages).
     */
    before?: Snowflake;

    /**
     * Maximum number of messages to fetch (1-100).
     */
    limit?: number;
  }

  /**
   * Pagination controls for retrieving members from a guild.
   */
  interface FetchMembersOptions {
    /**
     * Fetch members after this ID for pagination.
     */
    after?: Snowflake;

    /**
     * Maximum number of members to fetch (1-1000).
     */
    limit?: number;
  }

  /**
   * A lightweight handle for the channel attached to a message.
   * Sending through this handle does not fetch the full channel first.
   */
  class MessageChannel {
    /**
     * Channel ID.
     */
    readonly id: Snowflake;

    /**
     * Send a message to this channel.
     *
     * @param content Message body or full send options.
     * @returns The newly sent message.
     */
    send(content: string | SendMessageOptions): Promise<Message>;

    /**
     * Trigger Discord's typing indicator in this channel.
     */
    typing(): Promise<void>;

    /**
     * Fetch the full channel object when channel metadata or specialized
     * channel methods are needed.
     */
    fetch(): Promise<TextChannel>;
  }

  /**
   * A message snapshot received from Discord or returned by a REST request.
   * Event objects are not live views. Call {@link Message.fetch} when a handler needs the newest state.
   *
   * #### Example
   * ```ts
   * discord.on(discord.events.MESSAGE_CREATE, async (message) => {
   *   if (message.author.bot || message.content !== '!ping') return;
   *   await message.reply('pong');
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/resources/message#message-object
   */
  class Message {
    /**
     * Files attached to the message.
     */
    readonly attachments: Attachment[];

    /**
     * User or webhook identity that sent the message, or `null` when Discord
     * omits the author from a partial message payload.
     */
    readonly author: User | null;

    /**
     * Lightweight channel handle. Use it to send without fetching the full
     * channel first, for example `await message.channel.send("Hello")`.
     */
    readonly channel: MessageChannel;

    /**
     * ID of the channel where this message was sent.
     */
    readonly channelId: Snowflake;

    /**
     * Raw message content.
     */
    readonly content: string;

    /**
     * When this message was created.
     */
    readonly createdAt: Date;

    /**
     * Timestamp derived from the Discord snowflake ID, in milliseconds since epoch.
     */
    readonly createdTimestamp: number;

    /**
     * When this message was last edited, or `null` if it has not been edited.
     */
    readonly editedAt: Date | null;

    /**
     * Edited timestamp in milliseconds since epoch, or `null` if never edited.
     */
    readonly editedTimestamp: number | null;

    /**
     * Rich embeds in the message.
     */
    readonly embeds: Embed[];

    /**
     * Bitmask of message flags, or `null` if none.
     */
    readonly flags: number;

    /**
     * ID of the guild this message was sent in, or `null` when Discord omits it.
     */
    readonly guildId: Snowflake | null;

    /**
     * Message ID.
     */
    readonly id: Snowflake;

    /**
     * The guild member who sent the message, or `null` if not in a guild.
     */
    readonly member: GuildMember | null;

    /**
     * Indicates whether the message mentions everyone or here.
     */
    readonly mentionEveryone: boolean;

    /**
     * IDs of roles explicitly mentioned in the message.
     */
    readonly mentionRoles: Snowflake[];

    /**
     * User objects explicitly mentioned in the message content.
     * This array does not include users mentioned only inside embeds or components.
     */
    readonly mentions: User[];

    /**
     * Whether this message is pinned in its channel.
     */
    readonly pinned: boolean;

    /**
     * Poll attached to this message, or `null` if none.
     */
    readonly poll: Poll | null;

    /**
     * Reactions on the message.
     */
    readonly reactions: MessageReaction[];

    /**
     * Reference to a replied-to or crossposted message, or `null`.
     */
    readonly reference: MessageReference | null;

    /**
     * The message being replied to, or `null` when unavailable.
     */
    readonly referencedMessage: Message | null;

    /**
     * The type of message (system message, reply, etc.).
     */
    readonly type: MessageType;

    /**
     * A URL that can be used to jump to this message in Discord.
     */
    readonly url: string;

    /**
     * ID of the webhook that sent this message, or `null` if sent by a user.
     */
    readonly webhookId: Snowflake | null;

    /**
     * Remove all reactions for a specific emoji, or all reactions if no emoji is given.
     *
     * @param emoji Emoji string to clear, or omit to clear all reactions.
     */
    clearReactions(emoji?: string): Promise<void>;

    /**
     * Create a thread from this message.
     *
     * @param options Thread options including name, auto-archive duration, and slowmode.
     * @returns The created thread channel.
     */
    createThread(
      options: ThreadFromMessageCreateOptions,
    ): Promise<ThreadChannel>;

    /**
     * Crosspost (publish) this message to followed channels. Only valid in announcement channels.
     *
     * @returns The published message.
     */
    crosspost(): Promise<Message>;

    /**
     * Delete this message.
     *
     * @param reason Audit-log reason for deleting the message.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit this message with new content or options.
     *
     * @param content New message body as a string, or an options object with embeds, components, etc.
     * @returns The updated message.
     */
    edit(content: string | EditMessageOptions): Promise<Message>;

    /**
     * End the poll on this message early and publish results.
     *
     * @returns The updated message with finalized poll results.
     */
    endPoll(): Promise<Message>;

    /**
     * Requests the latest version of this message from Discord.
     * Use this when the event snapshot may be stale after edits, reactions, or poll updates.
     *
     * @returns The updated message.
     */
    fetch(): Promise<Message>;

    /**
     * Fetch users who reacted to this message with a specific emoji.
     *
     * @param emoji Emoji string (for example `"🔥"` or `"name:id"` for a custom emoji).
     * @param options Optional pagination. Discord returns up to 100 users per request.
     * @returns Array of users who reacted with that emoji.
     */
    fetchReactionUsers(
      emoji: string,
      options?: {
        after?: Snowflake;
        limit?: number;
      },
    ): Promise<User[]>;

    /**
     * Forward this message's content and embeds to another channel.
     *
     * @param channelId The ID of the channel to forward to.
     * @returns The sent message in the target channel.
     */
    forward(channelId: Snowflake): Promise<Message>;

    /**
     * Fetch the channel this message was sent in from Discord.
     */
    fetchChannel(): Promise<TextChannel>;

    /**
     * Fetch the guild, or return `null` when Discord omitted the guild ID.
     *
     * @returns The guild, or `null` if this message was not sent in a guild.
     */
    fetchGuild(): Promise<Guild | null>;

    /**
     * Pin this message to the channel.
     *
     * @param reason Audit-log reason for pinning the message.
     */
    pin(reason?: string): Promise<void>;

    /**
     * Add a reaction to this message using a Discord emoji string.
     *
     * @param emoji Emoji string (e.g. `"🔥"` for unicode or `"custom:123"` for custom emoji).
     */
    react(emoji: string): Promise<void>;

    /**
     * Remove all reactions from this message.
     */
    removeAllReactions(): Promise<void>;

    /**
     * Remove another user's reaction from this message.
     *
     * @param emoji The emoji string identifying the reaction.
     * @param userId The ID of the user whose reaction to remove.
     */
    removeReaction(emoji: string, userId: Snowflake): Promise<void>;

    /**
     * Reply to this message with text or full message options.
     * The returned message is the newly created reply, not this source message.
     *
     * @param content Message body as a string, or a full options object for embeds, files, etc.
     * @returns The sent message.
     * @throws {@link errors.DiscordError} When Discord rejects the message or the channel is unavailable.
     */
    reply(content: string | SendMessageOptions): Promise<Message>;

    /**
     * Unpin this message from the channel.
     *
     * @param reason Audit-log reason for unpinning the message.
     */
    unpin(reason?: string): Promise<void>;

    /**
     * Remove your bot's reaction by emoji.
     *
     * @param emoji The emoji string identifying the reaction to remove.
     */
    unreact(emoji: string): Promise<void>;
  }

  /**
   * A message sent in a guild channel, guaranteed to have a guild ID and member.
   */
  class GuildMemberMessage extends Message {
    /**
     * User who sent this message.
     */
    readonly author: User;

    /**
     * ID of the guild where this message was sent.
     */
    readonly guildId: Snowflake;

    /**
     * Guild member who sent this message.
     */
    readonly member: GuildMember;

    /**
     * Fetch the guild where this message was sent.
     */
    fetchGuild(): Promise<Guild>;
  }

  /**
   * Aggregated reaction data for one emoji on a message.
   */
  class MessageReaction {
    /**
     * Number of users who reacted with this emoji.
     */
    readonly count: number;

    /**
     * Emoji this reaction entry represents.
     */
    readonly emoji: EmojiData;

    /**
     * Whether the bot reacted with this emoji.
     */
    readonly me: boolean;

    /**
     * Remove the bot's own reaction from this message.
     */
    remove(): Promise<void>;

    /**
     * Fetch the users who reacted with this emoji, with optional pagination.
     *
     * @param options Pagination options with `after` (user ID to start after) and `limit` (max users to return).
     * @returns Array of users who reacted.
     */
    users(options?: { after?: Snowflake; limit?: number }): Promise<User[]>;
  }

  /** The guild identity tag a user has chosen to display globally. */
  interface UserPrimaryGuild {
    identityGuildId: Snowflake | null;
    identityEnabled: boolean;
    tag: string | null;
    badge: string | null;
  }

  /**
   * A Discord account returned in an event payload or REST response.
   * The object is a snapshot. Call {@link User.fetch} when current profile data matters.
   *
   * @see https://docs.discord.com/developers/resources/user#user-object
   */
  class User implements Mentionable {
    /**
     * The user's accent color as a 24-bit RGB integer, or `null`.
     */
    readonly accentColor: number | null;

    /**
     * Hash of the user's avatar, or `null` if using the default avatar.
     */
    readonly avatar: string | null;

    /**
     * Hash of the user's banner, or `null` if no banner is set.
     */
    readonly banner: string | null;

    /**
     * Indicates whether this user is a bot. `null` when Discord omits the field.
     */
    readonly bot: boolean | null;

    /**
     * When this Discord account was created, decoded from the user snowflake.
     */
    readonly createdAt: Date;

    /**
     * The user's four-digit discriminator (e.g. `"1234"`).
     */
    readonly discriminator: string;

    /**
     * The name best suited for display in user-facing output.
     * Returns the global display name when set, otherwise the username.
     *
     * @returns The display name string.
     */
    readonly displayName: string;

    /**
     * The user's global display name, or `null` if not set.
     */
    readonly globalName: string | null;

    /**
     * User ID.
     */
    readonly id: Snowflake;

    /**
     * Public Discord user flags bitfield, or `null` when Discord omitted it.
     */
    readonly publicFlags: number | null;

    /** The user's displayed guild identity, or `null` when none is selected. */
    readonly primaryGuild: UserPrimaryGuild | null;

    /**
     * The user's display name (not globally unique).
     */
    readonly username: string;

    /**
     * Get the CDN URL for the user's avatar.
     *
     * @param options Optional size and image format for the avatar.
     * @returns The CDN URL string.
     */
    displayAvatarURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string;

    /**
     * Refetch the latest user data from Discord.
     *
     * @returns The updated user object.
     */
    fetch(): Promise<User>;

    /**
     * Returns `username#discriminator`. For migrated accounts this is usually `username#0`.
     *
     * @returns The tag string.
     */
    getTag(): string;

    /**
     * Returns `<@userId>` mention syntax.
     *
     * @returns The mention string for this user.
     */
    toMention(): string;
  }

  /**
   * A user's membership state within one guild, including roles, nickname, permissions, and moderation state.
   * Unlike {@link User}, this object contains server-specific data and is only valid for `guildId`.
   *
   * @see https://docs.discord.com/developers/resources/guild#guild-member-object
   */
  class GuildMember implements Mentionable {
    /**
     * When the member's timeout expires, or `null` if not timed out.
     */
    readonly communicationDisabledUntil: Date | null;

    /**
     * When the underlying user account was created, decoded from the member/user snowflake.
     */
    readonly createdAt: Date;

    /**
     * Get the display name (nickname, then global name, then username as fallback).
     *
     * @returns The display name string.
     */
    readonly displayName: string;

    /**
     * ID of the guild this member belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * User ID for this guild member.
     */
    readonly id: Snowflake;

    /**
     * Whether the member is currently timed out.
     */
    readonly isTimedOut: boolean;

    /**
     * When the member joined the guild.
     */
    readonly joinedAt: Date;

    /**
     * The member's nickname (server name), or `null` if not set.
     */
    readonly nick: string | null;

    /**
     * Whether the member has not yet passed the guild's membership screening requirements.
     */
    readonly pending: boolean;

    /**
     * Combined permission bitmask for this member (guild-level + role-based), or 0 before cache is populated.
     */
    readonly permissions: bigint;

    /**
     * When the member started boosting, or `null` if not boosting.
     */
    readonly premiumSince: Date | null;

    /**
     * Array of role IDs assigned to this member.
     */
    readonly roles: Snowflake[];

    /**
     * The underlying user object.
     */
    readonly user: User;

    /**
     * Add a role to this member.
     *
     * @param roleId The ID of the role to add.
     * @param reason Audit-log reason for adding the role.
     */
    addRole(roleId: Snowflake, reason?: string): Promise<void>;

    /**
     * Ban this member from the guild.
     *
     * @param options Options for the ban. `deleteMessageSeconds` must be an integer from 0 through 604800.
     */
    ban(options?: {
      deleteMessageSeconds?: number;
      reason?: string;
    }): Promise<void>;

    /**
     * Check if this member has a specific permission (checks roles + admin).
     *
     * @param permission The permission flag to check.
     * @returns Whether the member has the permission.
     */
    can(permission: PermissionFlag): boolean;
    /**
     * Resolve the effective permissions for this member using Discord's permission hierarchy:
     * guild owner bypass → @everyone → roles OR → administrator short-circuit → channel overwrites.
     *
     * @param channelId Optional channel ID to apply permission overwrites for. When omitted, only
     *                   guild-level and role permissions are computed.
     * @returns The resolved permission bitmask.
     */
    resolvePermissions(channelId?: Snowflake): Promise<bigint>;
    /**
     * Check if this member has a specific permission in a given channel.
     *
     * @param channelId The channel to resolve permissions for.
     * @param permission The permission flag(s) to test.
     * @returns Whether every requested permission flag is set.
     */
    canIn(channelId: Snowflake, permission: PermissionFlag): Promise<boolean>;

    /**
     * Get the CDN URL for the member's guild-specific avatar (falls back to user avatar).
     *
     * @param options Optional size and image format for the avatar.
     * @returns The CDN URL string.
     */
    displayAvatarURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string;

    /**
     * Requests the latest guild-member data from Discord.
     * This is useful after role, nickname, timeout, or membership changes.
     *
     * @returns The updated member object.
     */
    fetch(): Promise<GuildMember>;

    /**
     * Edit this member's guild-specific state.
     *
     * @param options Member properties to update and optional audit-log reason.
     * @returns The updated member.
     */
    edit(options: GuildMemberEditOptions): Promise<GuildMember>;

    /**
     * Fetch the guild this member belongs to from Discord.
     *
     * @returns The guild object.
     */
    fetchGuild(): Promise<Guild>;

    /**
     * Get this member's cached presence, or another member's presence by user ID.
     * Returns `null` when Discord has not provided a cached presence.
     *
     * @param userId Optional user ID. Defaults to this member's user ID.
     * @returns The cached presence, or null when unavailable.
     */
    getCachedPresence(userId?: Snowflake): Promise<Presence | null>;

    /** Get this member's current voice state from Weeble's gateway cache. */
    getVoiceState(): Promise<VoiceState | null>;

    /**
     * Check if this member has a specific role.
     *
     * @param roleId The ID of the role to check.
     * @returns Whether the member has the role.
     */
    hasRole(roleId: Snowflake): boolean;

    /**
     * Get the highest-positioned role this member has.
     *
     * @returns The highest role, or null if the member has no roles.
     */
    highestRole(): Promise<Role | null>;

    /**
     * Kick this member from the guild.
     *
     * @param reason Audit-log reason for removing the member.
     */
    kick(reason?: string): Promise<void>;

    /**
     * Remove a role from this member.
     *
     * @param roleId The ID of the role to remove.
     * @param reason Audit-log reason for removing the role.
     */
    removeRole(roleId: Snowflake, reason?: string): Promise<void>;

    /**
     * Get all role objects assigned to this member.
     *
     * @returns Array of role objects.
     */
    roleObjects(): Promise<Role[]>;

    /**
     * Set or clear the member's nickname. Requires `MANAGE_NICKNAMES` permission.
     *
     * @param nickname The new nickname, or null to clear.
     * @param reason The reason for the audit log.
     */
    setNickname(nickname: string | null, reason?: string): Promise<void>;

    /**
     * Time-out the member for a duration in milliseconds, or `null` to remove timeout.
     *
     * @param durationMs Positive integer duration in milliseconds, no greater than 28 days, or null to remove timeout.
     * @param reason The reason for the audit log.
     */
    timeout(durationMs: number | null, reason?: string): Promise<void>;

    /**
     * Returns `<@userId>` mention syntax.
     *
     * @returns The mention string for this member.
     */
    toMention(): string;
  }

  /**
   * Shared channel data available before narrowing to a concrete channel class.
   * Prefer the `discord.is*Channel()` guards or a `ChannelType` comparison before
   * calling methods that only exist on text, voice, forum, or thread channels.
   *
   * @see https://docs.discord.com/developers/resources/channel#channel-object
   */
  class Channel implements Mentionable {
    /**
     * When this channel was created, decoded from the channel snowflake.
     */
    readonly createdAt: Date | null;

    /**
     * Channel ID.
     */
    readonly id: Snowflake;

    /**
     * The type of this channel — use this to narrow to the correct subclass.
     */
    readonly type: ChannelType;

    /**
     * Delete this channel.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Requests the latest channel data from Discord instead of relying on cached state.
     */
    fetch(): Promise<AnyChannel>;

    /**
     * Returns `<#channelId>` mention syntax.
     */
    toMention(): string;
  }

  /**
   * Base class for all guild-bound channels (text, voice, category, forum, stage, etc.).
   */
  class GuildChannel extends Channel {
    /**
     * ID of the guild this channel belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Channel name.
     */
    readonly name: string;

    /**
     * ID of the parent category channel, or `null` when not categorized.
     */
    readonly parentId: Snowflake | null;

    /**
     * Permission overwrites applied to this channel. Each entry has an `allow` and `deny` bitfield as decimal strings.
     */
    readonly permissionOverwrites: Array<{
      allow: string;
      deny: string;
      id: Snowflake;
      type: PermissionOverwriteType;
    }>;

    /**
     * Manager for permission overwrites on this channel.
     */
    readonly permissions: ChannelPermissionManager;

    /**
     * Position in the channel list (left-to-right, top-to-bottom).
     */
    readonly position: number;

    /**
     * Discord URL to jump to this channel.
     */
    readonly url: string;

    /**
     * Check if a member has a specific permission in this channel.
     *
     * @param permission The permission flag to check.
     * @param member The guild member to check.
     * @returns Whether the member has the permission.
     */
    canMember(
      permission: PermissionFlag,
      member: GuildMember,
    ): Promise<boolean>;

    /**
     * Check if a role has a specific permission in this channel.
     *
     * @param permission The permission flag to check.
     * @param role The role to check.
     * @returns Whether the role has the permission.
     */
    canRole(permission: PermissionFlag, role: Role): Promise<boolean>;

    /**
     * Create an invite for this channel.
     *
     * @param options Optional invite settings (max age, max uses, etc.).
     * @returns The created invite.
     */
    createInvite(options?: InviteCreateOptions): Promise<Invite>;

    /**
     * Fetch the guild this channel belongs to from Discord.
     *
     * @returns The guild object.
     */
    fetchGuild(): Promise<Guild>;

    /**
     * Fetch all invites for this channel.
     *
     * @returns Array of invites.
     */
    getInvites(): Promise<Invite[]>;

    /**
     * Get the effective permission bitmask for a specific member in this channel (accounting for overwrites).
     *
     * @param member The guild member to check.
     * @returns The permission bitmask.
     */
    getMemberPermissions(member: GuildMember): Promise<bigint>;

    /**
     * Get the effective permission bitmask for a role in this channel.
     *
     * @param role The role to check.
     * @returns The permission bitmask.
     */
    getRolePermissions(role: Role): Promise<bigint>;

    /**
     * Returns `<#channelId>` mention syntax.
     *
     * @returns The mention string for this channel.
     */
    toMention(): string;
  }

  /** A message returned by Discord's pinned-message endpoint. */
  interface PinnedMessage {
    pinnedAt: Date;
    message: Message;
  }

  interface PinPage {
    items: PinnedMessage[];
    hasMore: boolean;
    nextBefore: string | null;
  }

  /**
   * A standard text or announcement channel in a guild.
   *
   * #### Example
   * ```ts
   * const channel = await discord.fetchGuildTextChannel('1504537312841961583');
   * if (channel) await channel.send('Deployment finished.');
   * ```
   */
  class GuildTextChannel extends GuildChannel {
    /** Text and announcement channels share the text-channel API. */
    readonly type:
      | typeof ChannelType.GUILD_TEXT
      | typeof ChannelType.GUILD_ANNOUNCEMENT;
    /**
     * Indicates whether this channel is marked as not-safe-for-work.
     */
    readonly nsfw: boolean;

    /**
     * Slow mode cooldown in seconds (0 = disabled).
     */
    readonly rateLimitPerUser: number;

    /**
     * The channel topic, or `null` if not set.
     */
    readonly topic: string | null;

    /**
     * Bulk delete messages by ID (Discord limit: 2-100, older than 2 weeks fails).
     *
     * @param messageIds Array of message IDs to delete.
     * @param reason The reason for the audit log.
     */
    bulkDelete(messageIds: Snowflake[], reason?: string): Promise<void>;

    /**
     * Create a poll in this channel.
     *
     * @param question The poll question.
     * @param answers Array of poll answers.
     * @param duration Duration of the poll in hours.
     * @param allowMultiselect Whether members can select multiple answers.
     * @returns The message containing the poll.
     */
    createPoll(
      question: string,
      answers: string[],
      duration: number,
      allowMultiselect?: boolean,
    ): Promise<Message>;

    /**
     * Create a new thread in this channel.
     *
     * @param options Thread creation options including name and auto-archive duration.
     * @returns The created thread.
     */
    createThread(options: ThreadCreateOptions): Promise<ThreadChannel>;

    /**
     * Create a thread from an existing message.
     *
     * @param messageId The ID of the source message.
     * @param options Thread creation options including name and auto-archive duration.
     * @returns The created thread.
     */
    createThreadFromMessage(
      messageId: Snowflake,
      options: ThreadFromMessageCreateOptions,
    ): Promise<ThreadChannel>;

    /**
     * Create a webhook for this channel.
     *
     * @param options Webhook creation options including name and optional avatar.
     * @returns The created webhook.
     */
    createWebhook(options: {
      avatar?: string;
      name: string;
      reason?: string;
    }): Promise<Webhook>;

    /**
     * Edit channel properties.
     *
     * @param options The channel properties to update.
     * @returns The updated channel.
     */
    edit(options: GuildTextChannelEditOptions): Promise<GuildTextChannel>;

    /**
     * Fetch recent messages with optional pagination.
     *
     * @param options Optional pagination parameters.
     * @returns Array of messages.
     */
    fetchMessages(options?: FetchMessagesOptions): Promise<Message[]>;

    /**
     * Fetch all pinned messages in this channel.
     *
     * @returns Array of pinned messages.
     */
    fetchPinnedMessages(): Promise<Message[]>;

    /** Fetch a page of pinned messages with Discord's cursor-based pins API. */
    fetchPins(options?: {
      before?: string | Date;
      limit?: number;
    }): Promise<PinPage>;

    /**
     * Fetch all webhooks in this channel.
     *
     * @returns Array of webhooks.
     */
    fetchWebhooks(): Promise<Webhook[]>;

    /**
     * Fetch a specific message by ID, or `null` if not found.
     *
     * @param messageId The ID of the message to fetch.
     * @returns The message, or null if not found.
     */
    getMessage(messageId: Snowflake): Promise<Message | null>;

    /**
     * Send a message in this channel.
     *
     * @param content The message content or send options.
     * @returns The sent message.
     */
    send(content: string | SendMessageOptions): Promise<Message>;

    /**
     * Convenience method to toggle the NSFW flag.
     *
     * @param nsfw Whether the channel should be NSFW.
     * @returns The updated channel.
     */
    setNsfw(nsfw: boolean): Promise<GuildTextChannel>;

    /**
     * Convenience method to set the slow mode cooldown.
     *
     * @param seconds Slow mode cooldown in seconds (0 to disable).
     * @returns The updated channel.
     */
    setSlowmode(seconds: number): Promise<GuildTextChannel>;

    /**
     * Convenience method to set the channel topic.
     *
     * @param topic The new topic, or null to clear.
     * @returns The updated channel.
     */
    setTopic(topic: string | null): Promise<GuildTextChannel>;

    /**
     * Trigger the typing indicator in this channel.
     */
    typing(): Promise<void>;
  }

  /**
   * A guild voice channel.
   */
  class GuildVoiceChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_VOICE;
    /**
     * Audio bitrate in bps.
     */
    readonly bitrate: number;

    /**
     * Maximum number of users allowed in the channel (0 = unlimited).
     */
    readonly userLimit: number;

    /**
     * Edit voice channel properties.
     *
     * @param options The voice channel properties to update.
     * @returns The updated voice channel.
     */
    edit(options: GuildVoiceChannelEditOptions): Promise<GuildVoiceChannel>;

    /** Set the status displayed for this voice channel. */
    setStatus(status: string, reason?: string): Promise<void>;

    /** Clear the status displayed for this voice channel. */
    clearStatus(reason?: string): Promise<void>;

    /** List the voice states currently cached for this channel. */
    fetchVoiceStates(): Promise<VoiceState[]>;
  }

  /**
   * A category channel that groups other channels in the channel list.
   */
  class GuildCategory extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_CATEGORY;
    /**
     * Always `null`; category channels cannot have parent categories.
     */
    readonly parentId: null;

    /**
     * Edit category properties.
     *
     * @param options The category properties to update.
     * @returns The updated category.
     */
    edit(options: {
      name?: string;
      position?: number;
      reason?: string;
    }): Promise<GuildCategory>;
  }

  /** A guild announcement channel for messages that can be published to followers. */
  class GuildAnnouncementChannel extends GuildTextChannel {
    readonly type: typeof ChannelType.GUILD_ANNOUNCEMENT;
    /**
     * Follow this announcement channel into another channel.
     *
     * @param targetChannelId Channel that should receive published messages.
     * @param reason Audit-log reason for creating the follower webhook.
     */
    follow(targetChannelId: Snowflake, reason?: string): Promise<void>;

    /**
     * Publish a message to followed channels.
     *
     * @param messageId The ID of the message to publish.
     * @returns The published message.
     */
    publishMessage(messageId: Snowflake): Promise<Message>;
  }

  /**
   * A forum-style channel with individual posts organized as threads.
   */
  class GuildForumChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_FORUM;
    /**
     * Create a new forum post (thread with initial message).
     *
     * @param options The post creation options including name, message content, and optional tags.
     * @returns The created thread.
     */
    createPost(options: ForumPostCreateOptions): Promise<ThreadChannel>;

    /**
     * Edit forum channel properties.
     *
     * @param options The forum channel properties to update.
     * @returns The updated forum channel.
     */
    edit(options: {
      name?: string;
      reason?: string;
      topic?: string | null;
    }): Promise<GuildForumChannel>;
  }

  /**
   * A stage channel designed for voice events with speakers and an audience.
   */
  class GuildStageVoiceChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_STAGE_VOICE;
    /**
     * Audio bitrate in bps.
     */
    readonly bitrate: number;

    /**
     * The stage topic, or `null` if not set.
     */
    readonly topic: string | null;

    /**
     * Edit stage channel properties.
     *
     * @param options The stage channel properties to update.
     * @returns The updated stage channel.
     */
    edit(
      options: GuildStageVoiceChannelEditOptions,
    ): Promise<GuildStageVoiceChannel>;

    setStatus(status: string, reason?: string): Promise<void>;
    clearStatus(reason?: string): Promise<void>;
    fetchVoiceStates(): Promise<VoiceState[]>;
  }

  /**
   * A temporary sub-channel within a guild text or forum channel.
   */
  class ThreadChannel extends Channel {
    readonly type:
      | typeof ChannelType.ANNOUNCEMENT_THREAD
      | typeof ChannelType.PUBLIC_THREAD
      | typeof ChannelType.PRIVATE_THREAD;
    /**
     * ID of the guild this thread belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * ID of the member who created this thread, or `null`.
     */
    readonly ownerId: Snowflake | null;

    /**
     * ID of the parent channel, or `null` if not available.
     */
    readonly parentId: Snowflake | null;

    /**
     * Add a member to this thread.
     *
     * @param userId The ID of the user to add.
     */
    addThreadMember(userId: Snowflake): Promise<void>;

    /**
     * Archive this thread.
     *
     * @param reason Audit-log reason for archiving the thread.
     * @returns The archived thread.
     */
    archive(reason?: string): Promise<ThreadChannel>;

    /**
     * Edit thread properties.
     *
     * @param options Thread fields to update. Omitted fields are left unchanged.
     * @returns The updated thread.
     */
    edit(options: ThreadChannelEditOptions): Promise<ThreadChannel>;

    /**
     * Fetch recent messages with optional pagination.
     *
     * @param options Optional pagination parameters.
     * @returns Array of messages.
     */
    fetchMessages(options?: FetchMessagesOptions): Promise<Message[]>;

    /** Fetch a page of pinned messages with Discord's cursor-based pins API. */
    fetchPins(options?: {
      before?: string | Date;
      limit?: number;
    }): Promise<PinPage>;

    /**
     * Fetch members participating in this thread.
     *
     * @returns Array of thread member objects.
     */
    fetchThreadMembers(): Promise<
      Array<{
        id: Snowflake;
        joinedAt: Date | null;
        userId: Snowflake;
      }>
    >;

    /**
     * Fetch a specific message by ID, or `null` if not found.
     *
     * @param messageId The ID of the message to fetch.
     * @returns The message, or null if not found.
     */
    getMessage(messageId: Snowflake): Promise<Message | null>;

    /**
     * Add the bot to this thread.
     */
    join(): Promise<void>;

    /**
     * Remove the bot from this thread.
     */
    leave(): Promise<void>;

    /**
     * Remove a member from this thread.
     *
     * @param userId The ID of the user to remove.
     */
    removeThreadMember(userId: Snowflake): Promise<void>;

    /**
     * Send a message in this thread.
     *
     * @param content The message content or send options.
     * @returns The sent message.
     */
    send(content: string | SendMessageOptions): Promise<Message>;

    /**
     * Trigger the typing indicator in this thread.
     */
    typing(): Promise<void>;

    /**
     * Unarchive this thread (re-open it).
     *
     * @param reason Audit-log reason for unarchiving the thread.
     * @returns The unarchived thread.
     */
    unarchive(reason?: string): Promise<ThreadChannel>;
  }

  /**
   * Union of all guild channel types.
   */
  type AnyGuildChannel =
    | GuildTextChannel
    | GuildVoiceChannel
    | GuildCategory
    | GuildAnnouncementChannel
    | GuildForumChannel
    | GuildStageVoiceChannel;

  /**
   * Union of all supported guild and thread channel types.
   */
  type AnyChannel = AnyGuildChannel | ThreadChannel;

  /**
   * A channel that can receive ordinary messages.
   */
  type TextChannel =
    | GuildTextChannel
    | GuildAnnouncementChannel
    | ThreadChannel;

  /**
   * Manages permission overwrites on a guild channel.
   */
  class ChannelPermissionManager {
    /**
     * Delete a permission overwrite.
     *
     * @param overwriteId The ID of the role or member to remove overwrites for.
     */
    delete(overwriteId: Snowflake): Promise<void>;

    /**
     * Get the effective permission bitmask for a member or role in this channel.
     *
     * @param target The member or role to check.
     * @returns The effective permission bitmask.
     */
    for(target: GuildMember | Role): Promise<bigint>;

    /**
     * Set or update a permission overwrite for a role or member.
     *
     * @param overwriteId The ID of the role or member.
     * @param options The overwrite options including type, allow and deny bitfields.
     */
    set(
      overwriteId: Snowflake,
      options: PermissionOverwriteSetOptions,
    ): Promise<void>;
  }

  type GuildMessageSearchHas =
    | "image"
    | "sound"
    | "video"
    | "file"
    | "sticker"
    | "embed"
    | "link"
    | "poll"
    | "snapshot"
    | "-image"
    | "-sound"
    | "-video"
    | "-file"
    | "-sticker"
    | "-embed"
    | "-link"
    | "-poll"
    | "-snapshot";

  interface GuildMessageSearchOptions {
    content?: string;
    channelIds?: Snowflake[];
    authorIds?: Snowflake[];
    authorTypes?: Array<
      "user" | "bot" | "webhook" | "-user" | "-bot" | "-webhook"
    >;
    mentions?: Snowflake[];
    mentionRoleIds?: Snowflake[];
    mentionEveryone?: boolean;
    repliedToUserIds?: Snowflake[];
    repliedToMessageIds?: Snowflake[];
    pinned?: boolean;
    has?: GuildMessageSearchHas[];
    embedTypes?: Array<"image" | "video" | "gif" | "sound" | "article">;
    embedProviders?: string[];
    linkHostnames?: string[];
    attachmentExtensions?: string[];
    attachmentFilenames?: string[];
    sortBy?: "timestamp" | "relevance";
    sortOrder?: "asc" | "desc";
    includeNsfw?: boolean;
    maxId?: Snowflake;
    minId?: Snowflake;
    slop?: number;
    limit?: number;
    offset?: number;
  }

  interface GuildMessageSearchReadyResult {
    status: "ready";
    totalResults: number;
    groups: Message[][];
    doingDeepHistoricalIndex: boolean;
    documentsIndexed: number | null;
  }

  interface GuildMessageSearchIndexingResult {
    status: "indexing";
    totalResults: null;
    groups: [];
    doingDeepHistoricalIndex: true;
    documentsIndexed: number;
    retryAfter: number;
  }

  type GuildMessageSearchResult =
    | GuildMessageSearchReadyResult
    | GuildMessageSearchIndexingResult;

  /** Options for creating a channel invite. */
  interface InviteCreateOptions {
    /** Maximum invite lifetime in seconds, or `0` for no expiry. */
    maxAge?: number;
    /** Maximum number of uses, or `0` for unlimited uses. */
    maxUses?: number;
    /** Audit-log reason for creating the invite. */
    reason?: string;
    /** Whether members who join with the invite are removed after disconnecting. */
    temporary?: boolean;
    /** Whether Discord should create a unique invite instead of reusing one. */
    unique?: boolean;
  }

  /** Properties that can be changed on a guild member. */
  interface GuildMemberEditOptions {
    /** Voice channel to move the member to, or `null` to disconnect them. */
    channelId?: Snowflake | null;
    /** Timeout expiry, or `null` to remove the timeout. */
    communicationDisabledUntil?: Date | null;
    /** Whether the member is server deafened. */
    deaf?: boolean;
    /** Guild member flags. */
    flags?: number;
    /** Whether the member is server muted. */
    mute?: boolean;
    /** Guild nickname, or `null` to remove it. */
    nick?: string | null;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Complete set of role IDs assigned to the member. */
    roles?: Snowflake[];
  }

  /** Properties that can be changed on a guild emoji. */
  interface EmojiEditOptions {
    /** Emoji name. */
    name?: string;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Role IDs allowed to use the emoji. */
    roles?: Snowflake[];
  }

  /** Properties that can be changed on a stage instance. */
  interface StageInstanceEditOptions {
    /** Stage privacy level. */
    privacyLevel?: StageInstancePrivacyLevel;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Stage topic. */
    topic?: string;
  }

  /** Options for creating a thread from an existing message. */
  interface ThreadFromMessageCreateOptions {
    /** Minutes before inactivity automatically archives the thread. */
    autoArchiveDuration?: number;
    /** Thread name. */
    name: string;
    /** Slowmode delay in seconds. */
    rateLimitPerUser?: number;
    /** Audit-log reason for creating the thread. */
    reason?: string;
  }

  /** Options for creating a thread without an existing message. */
  interface ThreadCreateOptions extends ThreadFromMessageCreateOptions {
    /** Whether non-moderators may add members to a private thread. */
    invitable?: boolean;
    /** Discord thread channel type. */
    type?: ChannelType;
  }

  /** Properties that can be changed on a guild text channel. */
  interface GuildTextChannelEditOptions {
    /** Channel name. */
    name?: string;
    /** Whether the channel is age-restricted. */
    nsfw?: boolean;
    /** Slowmode delay in seconds. */
    rateLimitPerUser?: number;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Channel topic, or `null` to remove it. */
    topic?: string | null;
  }

  /** Properties that can be changed on a guild voice channel. */
  interface GuildVoiceChannelEditOptions {
    /** Voice bitrate in bits per second. */
    bitrate?: number;
    /** Channel name. */
    name?: string;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Maximum connected users, or `0` for no limit. */
    userLimit?: number;
  }

  /** Options for creating a post in a forum channel. */
  interface ForumPostCreateOptions {
    /** Initial message sent with the post. */
    message: SendMessageOptions;
    /** Post title. */
    name: string;
    /** Audit-log reason for creating the post. */
    reason?: string;
    /** IDs of forum tags applied to the post. */
    tags?: Snowflake[];
  }

  /** Properties that can be changed on a guild stage voice channel. */
  interface GuildStageVoiceChannelEditOptions {
    /** Voice bitrate in bits per second. */
    bitrate?: number;
    /** Channel name. */
    name?: string;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Stage topic. */
    topic?: string;
  }

  /** Properties that can be changed on a thread. */
  interface ThreadChannelEditOptions {
    /** Whether the thread is archived. */
    archived?: boolean;
    /** Minutes before inactivity automatically archives the thread. */
    autoArchiveDuration?: number;
    /** Whether non-moderators can add members to a private thread. */
    invitable?: boolean;
    /** Whether the thread is locked. */
    locked?: boolean;
    /** Thread name. */
    name?: string;
    /** Slowmode delay in seconds. */
    rateLimitPerUser?: number;
    /** Audit-log reason for the change. */
    reason?: string;
  }

  /** Permission overwrite values to set for a channel target. */
  interface PermissionOverwriteSetOptions {
    /** Allowed permission bitfield encoded as a decimal string. */
    allow?: string;
    /** Denied permission bitfield encoded as a decimal string. */
    deny?: string;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Whether the target is a role or member. */
    type: PermissionOverwriteType;
  }

  /** Options for pruning inactive guild members. */
  interface GuildPruneOptions {
    /** Whether Discord should calculate and return the prune count. */
    computePruneCount?: boolean;
    /** Number of inactive days required for removal. */
    days?: number;
    /** Role IDs whose members should also be considered for pruning. */
    includeRoles?: Snowflake[];
    /** Audit-log reason for starting the prune. */
    reason?: string;
  }

  /** Options for creating an auto moderation rule. */
  interface AutoModRuleCreateOptions {
    /** Actions performed when the rule triggers. */
    actions: AutoModAction[];
    /** Whether the rule is enabled immediately. */
    enabled?: boolean;
    /** Event that the rule evaluates. */
    eventType: AutoModEventType;
    /** Channel IDs exempt from the rule. */
    exemptChannels?: Snowflake[];
    /** Role IDs exempt from the rule. */
    exemptRoles?: Snowflake[];
    /** Rule name. */
    name: string;
    /** Audit-log reason for creating the rule. */
    reason?: string;
    /** Metadata used by the selected trigger type. */
    triggerMetadata?: AutoModTriggerMetadata;
    /** Trigger evaluated by the rule. */
    triggerType: AutoModTriggerType;
  }

  /** Options for creating a guild channel. */
  interface GuildChannelCreateOptions {
    /** Channel name. */
    name: string;
    /** Whether the channel is age-restricted. */
    nsfw?: boolean;
    /** Initial permission overwrites. */
    permissionOverwrites?: Array<{
      allow?: string;
      deny?: string;
      id: Snowflake;
      type: PermissionOverwriteType;
    }>;
    /** Audit-log reason for creating the channel. */
    reason?: string;
    /** Initial channel topic. */
    topic?: string;
    /** Discord channel type. */
    type?: ChannelType;
  }

  /** Options for creating a custom guild emoji. */
  interface EmojiCreateOptions {
    /** Base64-encoded emoji image. */
    image: string;
    /** Emoji name. */
    name: string;
    /** Audit-log reason for creating the emoji. */
    reason?: string;
    /** Role IDs allowed to use the emoji. */
    roles?: Snowflake[];
  }

  /** Options for creating a guild role. */
  interface RoleCreateOptions {
    /** Role color as an RGB integer. */
    color?: number;
    /** Whether the role is displayed separately in the member list. */
    hoist?: boolean;
    /** Whether members can mention the role. */
    mentionable?: boolean;
    /** Role name. */
    name: string;
    /** Initial permission bitfield. */
    permissions?: PermissionFlag;
    /** Audit-log reason for creating the role. */
    reason?: string;
  }

  /** Options for creating a scheduled guild event. */
  interface ScheduledEventCreateOptions {
    /** Voice or stage channel ID for the event. */
    channelId?: Snowflake;
    /** Event description. */
    description?: string;
    /** Metadata required by external events. */
    entityMetadata?: {
      location?: string;
    };
    /** Scheduled event entity type. */
    entityType: ScheduledEventEntityType;
    /** Event name. */
    name: string;
    /** Event privacy level. */
    privacyLevel?: ScheduledEventPrivacyLevel;
    /** Audit-log reason for creating the event. */
    reason?: string;
    /** Scheduled end time. */
    scheduledEndTime?: Date;
    /** Scheduled start time. */
    scheduledStartTime: Date;
  }

  /** Options for creating a stage instance. */
  interface StageInstanceCreateOptions {
    /** Stage channel ID. */
    channelId: Snowflake;
    /** Stage privacy level. */
    privacyLevel?: StageInstancePrivacyLevel;
    /** Audit-log reason for creating the stage instance. */
    reason?: string;
    /** Stage topic. */
    topic: string;
  }

  /** Options for creating a guild sticker. */
  interface StickerCreateOptions {
    /** Sticker description. */
    description?: string;
    /** Base64-encoded sticker image. */
    image: string;
    /** Sticker name. */
    name: string;
    /** Audit-log reason for creating the sticker. */
    reason?: string;
    /** Autocomplete tag describing the sticker. */
    tags: string;
  }

  /** Filters and pagination for fetching guild audit-log entries. */
  interface AuditLogFetchOptions {
    /** Only return entries with this action type. */
    actionType?: AuditLogActionType;
    /** Return entries after this entry ID. */
    after?: Snowflake;
    /** Return entries before this entry ID. */
    before?: Snowflake;
    /** Maximum number of entries to return. */
    limit?: number;
    /** Only return entries performed by this user. */
    userId?: Snowflake;
  }

  /** Properties that can be changed on a role. */
  interface RoleEditOptions {
    /** Role color as an RGB integer. */
    color?: number;
    /** Whether the role is displayed separately in the member list. */
    hoist?: boolean;
    /** Base64-encoded role icon. */
    icon?: string;
    /** Whether members can mention the role. */
    mentionable?: boolean;
    /** Role name. */
    name?: string;
    /** Role permission bitfield. */
    permissions?: PermissionFlag;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Unicode emoji used as the role icon. */
    unicodeEmoji?: string;
  }

  /** Properties that can be changed on an auto moderation rule. */
  interface AutoModRuleEditOptions {
    /** Replacement actions performed when the rule triggers. */
    actions?: AutoModAction[];
    /** Whether the rule is enabled. */
    enabled?: boolean;
    /** Channel IDs exempt from the rule. */
    exemptChannels?: Snowflake[];
    /** Role IDs exempt from the rule. */
    exemptRoles?: Snowflake[];
    /** Rule name. */
    name?: string;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Metadata used by the rule trigger. */
    triggerMetadata?: AutoModTriggerMetadata;
  }

  /** Properties that can be changed on a scheduled guild event. */
  interface ScheduledEventEditOptions {
    /** Voice or stage channel ID, or `null` for an external event. */
    channelId?: Snowflake | null;
    /** Event description. */
    description?: string;
    /** Metadata required by external events. */
    entityMetadata?: {
      location?: string;
    };
    /** Scheduled event entity type. */
    entityType?: ScheduledEventEntityType;
    /** Event name. */
    name?: string;
    /** Event privacy level. */
    privacyLevel?: ScheduledEventPrivacyLevel;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Scheduled end time. */
    scheduledEndTime?: Date;
    /** Scheduled start time. */
    scheduledStartTime?: Date;
    /** Event status. */
    status?: ScheduledEventStatus;
  }

  /** Properties that can be changed on a guild sticker. */
  interface StickerEditOptions {
    /** Sticker description. */
    description?: string;
    /** Sticker name. */
    name?: string;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Autocomplete tag describing the sticker. */
    tags?: string;
  }

  /** Properties that can be changed on a webhook. */
  interface WebhookEditOptions {
    /** Base64-encoded webhook avatar, or `null` to remove it. */
    avatar?: string | null;
    /** Channel ID to move the webhook to. */
    channelId?: Snowflake;
    /** Webhook name. */
    name?: string;
    /** Audit-log reason for the change. */
    reason?: string;
  }

  /** Properties that can be changed with {@link Guild.edit}. */
  interface GuildEditOptions {
    /** AFK voice channel ID, or `null` to remove it. */
    afkChannelId?: Snowflake | null;
    /** AFK timeout in seconds. */
    afkTimeout?: number;
    /** Base64-encoded guild banner, or `null` to remove it. */
    banner?: string | null;
    /** Default notification level for new messages. */
    defaultMessageNotifications?: number;
    /** Server description, or `null` to remove it. */
    description?: string | null;
    /** Explicit-content filter level. */
    explicitContentFilter?: number;
    /** Base64-encoded guild icon, or `null` to remove it. */
    icon?: string | null;
    /** Server name. */
    name?: string;
    /** Preferred Discord locale. */
    preferredLocale?: string;
    /** Whether the boost progress bar is enabled. */
    premiumProgressBarEnabled?: boolean;
    /** Community updates channel ID, or `null` to remove it. */
    publicUpdatesChannelId?: Snowflake | null;
    /** Audit-log reason for the change. */
    reason?: string;
    /** Community rules channel ID, or `null` to remove it. */
    rulesChannelId?: Snowflake | null;
    /** System messages channel ID, or `null` to remove it. */
    systemChannelId?: Snowflake | null;
    /** Verification level required to participate. */
    verificationLevel?: number;
  }

  /**
   * A Discord guild and the entry point for guild-scoped resources.
   * Fetch and mutation methods call Discord unless their documentation explicitly
   * identifies a gateway-cache lookup.
   *
   * #### Example
   * ```ts
   * const guild = await message.fetchGuild();
   * const member = guild ? await guild.fetchMember(message.author.id) : null;
   * ```
   *
   * @see https://docs.discord.com/developers/resources/guild#guild-object
   */
  class Guild {
    /**
     * Hash of the guild's banner, or `null` if not set.
     */
    readonly banner: string | null;

    readonly splash: string | null;
    readonly discoverySplash: string | null;
    readonly afkChannelId: Snowflake | null;
    readonly afkTimeout: number;
    readonly widgetEnabled: boolean;
    readonly widgetChannelId: Snowflake | null;
    readonly mfaLevel: number;
    readonly applicationId: Snowflake | null;
    readonly systemChannelId: Snowflake | null;
    readonly systemChannelFlags: number;
    readonly rulesChannelId: Snowflake | null;
    readonly publicUpdatesChannelId: Snowflake | null;
    readonly maxMembers: number | null;
    readonly maxPresences: number | null;
    readonly maxVideoChannelUsers: number | null;
    readonly maxStageVideoChannelUsers: number | null;
    readonly approximateMemberCount: number | null;
    readonly approximatePresenceCount: number | null;
    readonly nsfwLevel: number;
    readonly premiumProgressBarEnabled: boolean;
    readonly safetyAlertsChannelId: Snowflake | null;
    readonly roles: Map<Snowflake, Role>;
    readonly emojis: Map<Snowflake, Emoji>;
    readonly stickers: Map<Snowflake, Sticker>;
    readonly createdTimestamp: number;

    /**
     * When this guild was created.
     */
    readonly createdAt: Date;

    /**
     * Default notification level for the guild.
     */
    readonly defaultMessageNotifications: Guild.NotificationsLevel;

    /**
     * The guild's description shown in the Server Discovery listing, or `null`.
     */
    readonly description: string | null;

    /**
     * Level of content filtering applied to messages.
     */
    readonly explicitContentFilter: Guild.ExplicitContentFilterLevel;

    /**
     * Array of feature flags the guild has enabled.
     */
    readonly features: Guild.Feature[];

    /**
     * Hash of the guild's icon, or `null` if not set.
     */
    readonly icon: string | null;

    /**
     * Guild ID.
     */
    readonly id: Snowflake;

    /**
     * Member count reported by the gateway or latest guild REST response.
     * It may lag behind joins and leaves until Discord sends updated guild data.
     */
    readonly memberCount: number;

    /**
     * The guild's name.
     */
    readonly name: string;

    /**
     * ID of the guild owner.
     */
    readonly ownerId: Snowflake;

    /**
     * The guild's preferred locale (e.g. `"en-US"`).
     */
    readonly preferredLocale: string;

    /**
     * Number of Nitro boosts the guild currently has.
     */
    readonly premiumSubscriptionCount: number;

    /**
     * The guild's Nitro boost tier.
     */
    readonly premiumTier: Guild.PremiumTier;

    /**
     * The vanity invite code, or `null` if the guild doesn't have a vanity URL.
     */
    readonly vanityUrlCode: string | null;

    /**
     * Verification level required to send messages.
     */
    readonly verificationLevel: Guild.VerificationLevel;

    /**
     * Ban a user from the guild.
     *
     * @param userId The ID of the user to ban.
     * @param options Ban options (message deletion duration, reason).
     */
    ban(
      userId: Snowflake,
      options?: {
        deleteMessageSeconds?: number;
        reason?: string;
      },
    ): Promise<void>;

    /** Add a role to a guild member. */
    addRole(
      userId: Snowflake,
      roleId: Snowflake,
      reason?: string,
    ): Promise<void>;

    /** Remove a member from the guild. */
    kick(userId: Snowflake, reason?: string): Promise<void>;

    /** Remove a role from a guild member. */
    removeRole(
      userId: Snowflake,
      roleId: Snowflake,
      reason?: string,
    ): Promise<void>;

    /**
     * Begin a prune of inactive members.
     *
     * @param options Prune options (inactivity days, excluded roles, reason).
     * @returns The prune result with member count.
     */
    beginPrune(options?: GuildPruneOptions): Promise<{
      pruned: number | null;
    }>;

    /**
     * Create a new auto moderation rule.
     *
     * @param options Auto moderation rule options.
     * @returns The newly created rule.
     */
    createAutoModRule(options: AutoModRuleCreateOptions): Promise<AutoModRule>;

    /**
     * Create a new channel in this guild.
     *
     * @param options Channel creation options.
     * @returns The newly created channel.
     */
    createChannel(options: GuildChannelCreateOptions): Promise<AnyGuildChannel>;

    /**
     * Create a new custom emoji.
     *
     * @param options Emoji creation options.
     * @returns The newly created emoji.
     */
    createEmoji(options: EmojiCreateOptions): Promise<Emoji>;

    /**
     * Create a new role.
     *
     * @param options Role creation options.
     * @returns The newly created role.
     */
    createRole(options: RoleCreateOptions): Promise<Role>;

    /**
     * Create a new scheduled event.
     *
     * @param options Event creation options.
     * @returns The newly created event.
     */
    createScheduledEvent(
      options: ScheduledEventCreateOptions,
    ): Promise<ScheduledEvent>;

    /**
     * Create a stage instance in a stage channel.
     *
     * @param options Stage instance creation options.
     * @returns The newly created stage instance.
     */
    createStageInstance(
      options: StageInstanceCreateOptions,
    ): Promise<StageInstance>;

    /**
     * Create a new sticker.
     *
     * @param options Sticker creation options.
     * @returns The newly created sticker.
     */
    createSticker(options: StickerCreateOptions): Promise<Sticker>;

    /**
     * Create a new guild template from current settings.
     *
     * @param options Template creation options.
     * @returns The newly created template.
     */
    createTemplate(options: {
      description?: string;
      name: string;
    }): Promise<GuildTemplate>;

    /**
     * Delete the active stage instance.
     *
     * @param channelId Stage channel whose active instance should be deleted.
     * @param reason Reason for deletion, shown in audit log.
     */
    deleteStageInstance(channelId: Snowflake, reason?: string): Promise<void>;

    /**
     * Edit guild properties.
     *
     * @param options Guild properties to update.
     */
    edit(options: GuildEditOptions): Promise<Guild>;

    /**
     * Batch-edit role positions.
     *
     * @param positions Array of role entries with new positions.
     * @param reason Audit-log reason for changing the positions.
     * @returns The updated roles in their new order.
     */
    editRolePositions(
      positions: Array<{
        id: Snowflake;
        position: number;
      }>,
      reason?: string,
    ): Promise<Role[]>;

    /**
     * Refetch the latest guild data from Discord.
     *
     * @returns The updated guild object.
     */
    fetch(): Promise<Guild>;

    /**
     * Fetch a page of guild audit log entries and related resolved resources.
     * Requires the bot to have {@link PermissionFlags.VIEW_AUDIT_LOG}.
     *
     * @param options Optional filters and pagination options.
     * @see https://docs.discord.com/developers/resources/audit-log
     */
    fetchAuditLogs(options?: AuditLogFetchOptions): Promise<AuditLog>;

    /**
     * Fetch all auto moderation rules.
     *
     * @returns An array of all auto moderation rules.
     */
    fetchAutoModRules(): Promise<AutoModRule[]>;

    /**
     * Read a member's presence from Weeble's gateway cache, if currently known.
     */
    getCachedPresence(userId: Snowflake): Promise<Presence | null>;

    /**
     * Fetch all scheduled events.
     *
     * @returns An array of all scheduled events.
     */
    fetchScheduledEvents(options?: {
      withUserCount?: boolean;
    }): Promise<ScheduledEvent[]>;

    /**
     * Fetch the active stage instance.
     *
     * @returns The stage instance, or null if none is running.
     */
    fetchStageInstance(channelId: Snowflake): Promise<StageInstance | null>;

    /**
     * Fetch all stickers for this guild.
     *
     * @returns An array of all stickers.
     */
    fetchStickers(): Promise<Sticker[]>;

    /**
     * Fetch all guild templates.
     *
     * @returns An array of all templates.
     */
    fetchTemplates(): Promise<GuildTemplate[]>;

    /**
     * Fetch all webhooks for this guild.
     *
     * @returns An array of all webhooks.
     */
    fetchWebhooks(): Promise<Webhook[]>;

    /**
     * Fetch the ban record for a specific user.
     *
     * @param userId The ID of the banned user.
     * @returns The ban object.
     */
    getBan(userId: Snowflake): Promise<GuildBan | null>;

    /**
     * Fetch all bans in this guild.
     *
     * @returns An array of all guild bans.
     */
    getBans(): Promise<GuildBan[]>;

    /**
     * Fetch a specific channel by ID.
     *
     * @param channelId The ID of the channel to fetch.
     * @returns The channel, or null if not found.
     */
    fetchChannel(channelId: Snowflake): Promise<AnyGuildChannel | null>;

    /**
     * Fetch all channels in this guild.
     *
     * @returns An array of all guild channels.
     */
    fetchChannels(): Promise<AnyGuildChannel[]>;

    /**
     * Fetch a specific emoji by ID.
     *
     * @param emojiId The ID of the emoji to fetch.
     * @returns The emoji, or null if not found.
     */
    getEmoji(emojiId: Snowflake): Promise<Emoji | null>;

    /**
     * Fetch all emojis for this guild.
     *
     * @returns An array of all custom emojis.
     */
    getEmojis(): Promise<Emoji[]>;

    /**
     * Fetch all invites for this guild.
     *
     * @returns An array of all guild invites.
     */
    getInvites(): Promise<Invite[]>;

    /**
     * Fetches a guild member from Discord by user ID.
     *
     * @param userId The ID of the user to fetch.
     * @returns The guild member, or `null` when it cannot be retrieved.
     */
    fetchMember(userId: Snowflake): Promise<GuildMember | null>;

    /**
     * Fetch a role by ID.
     *
     * @param roleId The ID of the role to fetch.
     * @returns The role, or null if not found.
     */
    fetchRole(roleId: Snowflake): Promise<Role | null>;

    /**
     * Fetch all roles in this guild.
     *
     * @returns An array of all roles.
     */
    fetchRoles(): Promise<Role[]>;

    /**
     * Get the CDN URL for the guild's icon.
     *
     * @param options Icon size and format options.
     * @returns The icon URL, or null if no icon is set.
     */
    iconURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string | null;

    /** Get the CDN URL for the guild's banner. */
    bannerURL(options?: {
      format?: "png" | "jpg" | "webp";
      size?: number;
    }): string | null;

    /** Iterate guild audit log entries, optionally filtered by action or user. */
    iterAuditLogs(options?: {
      userId?: Snowflake;
      actionType?: AuditLogActionType;
      limit?: number;
    }): AsyncIterableIterator<AnyAuditLogEntry>;

    /**
     * Iterate over all guild members with optional pagination.
     *
     * @param options Pagination options (limit, after, etc.).
     * @returns An async iterable yielding members one at a time.
     */
    iterMembers(
      options?: FetchMembersOptions,
    ): AsyncIterableIterator<GuildMember>;

    /**
     * Fetch the bot's own member object for this guild.
     *
     * @returns The bot's guild member object.
     */
    me(): Promise<GuildMember>;

    /**
     * Preview how many members would be pruned.
     *
     * @param options Prune criteria (inactivity days, excluded roles).
     * @returns The estimated prune count.
     */
    previewPrune(options?: {
      days?: number;
      includeRoles?: Snowflake[];
    }): Promise<{
      pruned: number | null;
    }>;

    /**
     * Search for guild members by username or nickname prefix via Discord API.
     *
     * @param query The username or nickname prefix to search for.
     * @param options Optional search options.
     * @param options.limit Maximum number of results to return (1–1000, defaults to 1).
     * @returns Matching guild members.
     */
    searchMembers(
      query: string,
      options?: {
        limit?: number;
      },
    ): Promise<GuildMember[]>;

    /** Search messages across the guild while preserving grouped matches. */
    searchMessages(
      options: GuildMessageSearchOptions,
    ): Promise<GuildMessageSearchResult>;

    /**
     * Remove (unban) a user.
     *
     * @param userId The ID of the user to unban.
     * @param reason Reason for the unban, shown in audit log.
     */
    unban(userId: Snowflake, reason?: string): Promise<void>;
  }

  /**
   * Guild-scoped enums and feature type aliases.
   */
  namespace Guild {
    /**
     * Explicit content filter: 0 = disabled, 1 = members without roles, 2 = all members.
     */
    type ExplicitContentFilterLevel = 0 | 1 | 2;

    /**
     * Guild feature flag. Known values are listed; any string is accepted to support future features.
     */
    type Feature =
      | "ANIMATED_BANNER"
      | "ANIMATED_ICON"
      | "APPLICATION_COMMAND_PERMISSIONS_V2"
      | "AUTO_MODERATION"
      | "BANNER"
      | "COMMUNITY"
      | "CREATOR_MONETIZABLE_PROVISIONAL"
      | "CREATOR_STORE_PAGE"
      | "DEVELOPER_SUPPORT_SERVER"
      | "DISCOVERABLE"
      | "FEATURABLE"
      | "INVITES_DISABLED"
      | "INVITE_SPLASH"
      | "MEMBER_VERIFICATION_GATE_ENABLED"
      | "MORE_STICKERS"
      | "NEWS"
      | "PARTNERED"
      | "PREVIEW_ENABLED"
      | "PRIVATE_THREADS"
      | "RAID_ALERTS_DISABLED"
      | "ROLE_ICONS"
      | "ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE"
      | "ROLE_SUBSCRIPTIONS_ENABLED"
      | "SEVEN_DAY_THREAD_ARCHIVE"
      | "THREE_DAY_THREAD_ARCHIVE"
      | "TICKETED_EVENTS_ENABLED"
      | "VANITY_URL"
      | "VERIFIED"
      | "VIP_REGIONS"
      | "WELCOME_SCREEN_ENABLED"
      | (string & {});

    /**
     * Default notification level: 0 = all messages, 1 = only @mentions.
     */
    type NotificationsLevel = 0 | 1;

    /**
     * Boost tier: 0 = none, 1-3 = corresponding tier.
     */
    type PremiumTier = 0 | 1 | 2 | 3;

    /**
     * Verification level: 0 = none, 1 = low, 2 = medium, 3 = high, 4 = very high.
     */
    type VerificationLevel = 0 | 1 | 2 | 3 | 4;
  }

  /**
   * A guild ban record containing the banned user and the audit-log reason, when available.
   */
  class GuildBan {
    /**
     * Guild ID this ban applies to.
     */
    readonly guildId: Snowflake;

    /**
     * Reason for the ban, or `null` when Discord did not provide one.
     */
    readonly reason: string | null;

    /**
     * The banned user.
     */
    readonly user: User;

    /**
     * Unban the user.
     *
     * @param reason Audit-log reason for removing the ban.
     * @returns A promise that resolves when the unban is complete.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Fetch the guild for this ban from Discord.
     *
     * @returns The guild this ban belongs to.
     */
    fetchGuild(): Promise<Guild>;
  }

  /** Modern role colors, including optional gradient endpoints. */
  interface RoleColors {
    primary: number;
    secondary: number | null;
    tertiary: number | null;
  }

  /**
   * A guild role, including its permission bitfield, hierarchy position, and display settings.
   */
  class Role implements Mentionable {
    /**
     * 24-bit RGB color for this role, or 0 for default.
     */
    readonly color: number;

    /** Role colors. Prefer this over the legacy singular `color` field. */
    readonly colors: RoleColors;

    /**
     * When this role was created.
     */
    readonly createdAt: Date;

    /**
     * Guild ID this role belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Indicates whether this role is displayed separately in the member list.
     */
    readonly hoist: boolean;

    /**
     * Hash of the role's icon, or `null` if not set.
     */
    readonly icon: string | null;

    /**
     * Role ID.
     */
    readonly id: Snowflake;

    /**
     * Indicates whether this role is managed by an integration.
     */
    readonly managed: boolean;

    /**
     * Indicates whether this role can be mentioned by anyone.
     */
    readonly mentionable: boolean;

    /**
     * Role name.
     */
    readonly name: string;

    /**
     * Permission bitmask for this role.
     */
    readonly permissions: bigint;

    /**
     * Position in the role hierarchy (higher = higher priority).
     */
    readonly position: number;

    /**
     * Unicode emoji displayed as the role icon, or `null`.
     */
    readonly unicodeEmoji: string | null;

    /**
     * Delete this role.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit role properties.
     *
     * @param options Role properties to update.
     * @returns The updated role.
     */
    edit(options: RoleEditOptions): Promise<Role>;

    /**
     * Fetch guild members who have this role.
     */
    getMembers(options?: FetchMembersOptions): Promise<GuildMember[]>;

    /**
     * Get the mention string for this role.
     *
     * @returns The role mention string (`<@&roleId>`).
     */
    toMention(): string;
  }

  /**
   * A custom emoji owned by a guild.
   */
  class Emoji implements Mentionable {
    /**
     * Indicates whether this emoji is animated.
     */
    readonly animated: boolean;

    /**
     * When this emoji was created, decoded from the emoji snowflake.
     */
    readonly createdAt: Date | null;

    /**
     * Guild ID this emoji belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Emoji ID.
     */
    readonly id: Snowflake | null;

    /**
     * Emoji name used for the colon syntax (`:name:`).
     */
    readonly name: string | null;

    /** Role IDs allowed to use the emoji, or `null` when unrestricted. */
    readonly roles: Snowflake[] | null;

    /** User who created the emoji when Discord includes it. */
    readonly user: User | null;

    readonly requireColons: boolean | null;
    readonly managed: boolean;
    readonly available: boolean;

    /**
     * Delete this emoji.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit emoji properties.
     *
     * @param options Emoji properties to update (name, restricted roles).
     * @returns The updated emoji.
     */
    edit(options: EmojiEditOptions): Promise<Emoji>;

    /**
     * Get the CDN URL for this emoji image.
     *
     * @param size Optional image size in pixels (powers of 2, 16–4096).
     * @returns The CDN URL, or null if the emoji has no ID (unicode emoji).
     */
    getURL(size?: number): string | null;

    /**
     * Get the mention string for this emoji.
     *
     * @returns The emoji mention string (`<:name:id>` or `<a:name:id>`).
     */
    toMention(): string;
  }

  /**
   * Trigger-specific settings for an auto moderation rule.
   */
  interface AutoModTriggerMetadata {
    /**
     * Keywords that exempt messages from the rule.
     */
    allowList?: string[];

    /**
     * Keywords to match against message content.
     */
    keywordFilter?: string[];

    /**
     * Indicates whether mention raid protection is enabled.
     */
    mentionRaidProtectionEnabled?: boolean;

    /**
     * Max mentions allowed per message for mention spam rules.
     */
    mentionTotalLimit?: number;

    /**
     * Preset keyword lists by ID (`1` = profanity, `2` = sexual content, `3` = slurs).
     */
    presets?: number[];

    /**
     * Regex patterns to match against message content.
     */
    regexPatterns?: string[];
  }

  /**
   * Action-specific settings for an auto moderation rule response.
   */
  interface AutoModActionMetadata {
    /**
     * Channel ID where alert messages are sent.
     */
    channelId?: Snowflake;

    /**
     * Custom message shown to the user when blocked.
     */
    customMessage?: string;

    /**
     * Duration in seconds for timeout actions.
     */
    durationSeconds?: number;
  }

  /**
   * Action executed when an auto moderation rule matches.
   */
  interface AutoModAction {
    /**
     * Action-specific metadata, optional depending on action type.
     */
    metadata?: AutoModActionMetadata;

    /**
     * The type of action to take.
     */
    type: AutoModActionType;
  }

  /**
   * An Auto Moderation rule configured for a guild.
   *
   * @see https://docs.discord.com/developers/resources/auto-moderation
   */
  class AutoModRule {
    /**
     * Actions taken when this rule is triggered.
     */
    readonly actions: AutoModAction[];

    /**
     * When this auto moderation rule was created, decoded from the rule snowflake.
     */
    readonly createdAt: Date;

    /**
     * Indicates whether this rule is currently enabled.
     */
    readonly enabled: boolean;

    /**
     * The type of event that triggers this rule.
     */
    readonly eventType: AutoModEventType;

    /**
     * Channel IDs exempt from this rule.
     */
    readonly exemptChannels: Snowflake[];

    /**
     * Role IDs exempt from this rule.
     */
    readonly exemptRoles: Snowflake[];

    /**
     * Guild ID this rule belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Auto moderation rule ID.
     */
    readonly id: Snowflake;

    /**
     * Rule name.
     */
    readonly name: string;

    /**
     * Metadata specific to the trigger type.
     */
    readonly triggerMetadata: AutoModTriggerMetadata;

    /**
     * The type of trigger used by this rule.
     */
    readonly triggerType: AutoModTriggerType;

    /**
     * Delete this rule.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit rule properties.
     *
     * @param options Rule properties to update.
     * @returns The updated rule.
     */
    edit(options: AutoModRuleEditOptions): Promise<AutoModRule>;
  }

  /**
   * A scheduled guild event for a voice channel, stage channel, or external location.
   */
  class ScheduledEvent {
    /**
     * Channel ID for voice/stage events, or `null` for external events.
     */
    readonly channelId: Snowflake | null;

    /**
     * When this scheduled event was created, decoded from the event snowflake.
     */
    readonly createdAt: Date | null;

    /**
     * ID of the user who created the event, or `null`.
     */
    readonly creatorId: Snowflake | null;

    /**
     * Event description, or `null` if not set.
     */
    readonly description: string | null;

    /**
     * Type of entity the event is associated with.
     */
    readonly entityType: ScheduledEventEntityType;

    /**
     * Guild ID this event belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Scheduled event ID.
     */
    readonly id: Snowflake;

    /**
     * Event name.
     */
    readonly name: string;

    /**
     * Privacy level of the event.
     */
    readonly privacyLevel: ScheduledEventPrivacyLevel;

    /**
     * When the event is scheduled to end, or `null`.
     */
    readonly scheduledEndTime: Date | null;

    /**
     * When the event is scheduled to start.
     */
    readonly scheduledStartTime: Date;

    /**
     * Current status of the event.
     */
    readonly status: ScheduledEventStatus;

    /**
     * Delete this event.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit event properties.
     *
     * @param options Event properties to update.
     * @returns The updated event.
     */
    edit(options: ScheduledEventEditOptions): Promise<ScheduledEvent>;
  }

  /**
   * The live session attached to a stage channel.
   */
  class StageInstance {
    /**
     * Stage channel ID.
     */
    readonly channelId: Snowflake;

    /**
     * When this stage instance was created, decoded from the stage instance snowflake.
     */
    readonly createdAt: Date | null;

    /**
     * Guild ID this stage belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Stage instance ID.
     */
    readonly id: Snowflake;

    /**
     * Privacy level of the stage.
     */
    readonly privacyLevel: StageInstancePrivacyLevel;

    /**
     * The topic/subject of the stage.
     */
    readonly topic: string;

    /**
     * Delete this stage instance.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit stage instance properties.
     *
     * @param options Stage properties to update.
     * @returns The updated stage instance.
     */
    edit(options: StageInstanceEditOptions): Promise<StageInstance>;
  }

  /**
   * A custom sticker owned by a guild.
   */
  class Sticker {
    /**
     * Indicates whether this sticker is available for use.
     */
    readonly available: boolean | null;

    /**
     * When this sticker was created, decoded from the sticker snowflake.
     */
    readonly createdAt: Date;

    /**
     * Sticker description.
     */
    readonly description: string | null;

    /**
     * File format of the sticker.
     */
    readonly formatType: StickerFormatType;

    /**
     * Guild ID this sticker belongs to.
     */
    readonly guildId: Snowflake | null;

    /**
     * Sticker ID.
     */
    readonly id: Snowflake;

    /**
     * Sticker name.
     */
    readonly name: string;

    /**
     * Autocomplete/suggested tags for this sticker.
     */
    readonly tags: string;

    /**
     * Delete this sticker.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Edit sticker properties.
     *
     * @param options Sticker properties to update.
     * @returns The updated sticker.
     */
    edit(options: StickerEditOptions): Promise<Sticker>;
  }

  /** Partial guild information embedded in a Discord invite response. */
  class InviteGuild {
    readonly id: Snowflake;
    readonly name: string;
    readonly icon: string | null;
    readonly description: string | null;
    readonly features: string[];
    readonly verificationLevel: number | null;
    readonly vanityUrlCode: string | null;
    readonly createdTimestamp: number;
    readonly createdAt: Date;
    iconURL(options?: {
      size?: number;
      format?: "png" | "jpg" | "webp" | "gif";
    }): string | null;
  }

  /** Partial channel information embedded in a Discord invite response. */
  class InviteChannel {
    readonly id: Snowflake;
    readonly name: string | null;
    readonly type: number;
    readonly createdTimestamp: number;
    readonly createdAt: Date;
    toMention(): string;
  }

  /**
   * A Discord invite and any metadata returned for it by the current endpoint.
   * Count, expiration, and inviter-related fields may be absent depending on how
   * the invite was obtained and which options were requested.
   *
   * @see https://docs.discord.com/developers/resources/invite#invite-object
   */
  class Invite {
    /**
     * Approximate member count at the time the invite was fetched, or `null`.
     */
    readonly approximateMemberCount: number | null;

    /**
     * Approximate online member count, or `null`.
     */
    readonly approximatePresenceCount: number | null;

    /** Partial target channel information included with the invite. */
    readonly channel: InviteChannel | null;

    /**
     * Channel ID the invite targets, or `null`.
     */
    readonly channelId: Snowflake | null;

    /**
     * The invite code used in discord.gg/ links.
     */
    readonly code: string;

    /**
     * When this invite was created, or `null`.
     */
    readonly createdAt: Date | null;

    /**
     * When this invite expires, or `null`.
     */
    readonly expiresAt: Date | null;

    /**
     * Guild ID the invite targets, or `null`.
     */
    readonly guildId: Snowflake | null;

    /** Partial target guild information included with the invite. */
    readonly guild: InviteGuild | null;

    /** User who created the invite when Discord includes it. */
    readonly inviter: User | null;

    /** Type of invite target, or `null` for an ordinary channel invite. */
    readonly targetType: number | null;

    /** Target user for stream or embedded-application invites. */
    readonly targetUser: User | null;

    /** Target application metadata when Discord includes it. */
    readonly targetApplication: Record<string, unknown> | null;

    /**
     * Duration in seconds before the invite expires, or `null`.
     */
    readonly maxAge: number | null;

    /** Maximum number of uses. `0` means unlimited; `null` means Discord omitted the field. */
    readonly maxUses: number | null;

    /**
     * Indicates whether this invite grants temporary membership, or `null`.
     */
    readonly temporary: boolean | null;

    /**
     * Number of times this invite has been used, or `null`.
     */
    readonly uses: number | null;

    /**
     * Delete this invite.
     *
     * @param reason Audit-log reason for deleting the invite.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Refetch the latest invite data from Discord.
     *
     * @returns The updated invite object.
     */
    fetch(): Promise<Invite>;

    /**
     * Fetch the complete channel this invite targets through Discord REST.
     * Deployment guild isolation applies. Use `invite.channel` for the public
     * partial channel included with external invite responses.
     *
     * @returns The channel, or null if not available.
     */
    fetchChannel(): Promise<GuildTextChannel | GuildVoiceChannel | null>;

    /**
     * Fetch the complete guild this invite targets through Discord REST.
     * Deployment guild isolation applies. Use `invite.guild` for the public
     * partial guild included with external invite responses.
     *
     * @returns The guild, or null if not available.
     */
    fetchGuild(): Promise<Guild | null>;
  }

  /**
   * A Discord webhook that can send and manage messages without a gateway event.
   * Token-backed incoming webhooks can execute without the bot being connected to
   * the target guild; other operations still depend on Discord permissions.
   *
   * @see https://docs.discord.com/developers/resources/webhook
   */
  class Webhook {
    /**
     * Channel ID this webhook posts to, or `null`.
     */
    readonly channelId: Snowflake | null;

    /**
     * When this webhook was created, decoded from the webhook snowflake.
     */
    readonly createdAt: Date;

    /**
     * Guild ID this webhook belongs to, or `null`.
     */
    readonly guildId: Snowflake | null;

    /**
     * Webhook ID.
     */
    readonly id: Snowflake;

    /**
     * Webhook name, or `null`.
     */
    readonly name: string | null;

    /**
     * Webhook token (only available for incoming webhooks), or `null`.
     */
    readonly token: string | null;

    /**
     * Type of webhook.
     */
    readonly type: WebhookType;

    /**
     * Delete this webhook.
     *
     * @param reason Reason for deletion, shown in audit log.
     */
    delete(reason?: string): Promise<void>;

    /**
     * Delete a message sent by this webhook.
     *
     * @param messageId The ID of the message to delete.
     */
    deleteMessage(messageId: Snowflake): Promise<void>;

    /**
     * Edit webhook properties.
     *
     * @param options Webhook properties to update.
     * @returns The updated webhook.
     */
    edit(options: WebhookEditOptions): Promise<Webhook>;

    /**
     * Edit a message sent by this webhook.
     *
     * @param messageId The ID of the message to edit.
     * @param body The new message content and options.
     * @returns The updated message.
     */
    editMessage(
      messageId: Snowflake,
      body: EditMessageOptions,
    ): Promise<Message>;

    /**
     * Refetch the latest webhook data from Discord.
     *
     * @returns The updated webhook object.
     */
    fetch(): Promise<Webhook>;

    /**
     * Fetch a message sent by this webhook.
     *
     * @param messageId The ID of the message to fetch.
     * @returns The fetched message, or null if not found.
     */
    getMessage(messageId: Snowflake): Promise<Message | null>;

    /**
     * Execute the webhook to send a message.
     *
     * @param content The message content or formatted options.
     * @returns The sent message.
     */
    send(content: string | WebhookExecuteOptions): Promise<Message>;
  }

  /**
   * A reusable snapshot of a guild's channels, roles, and settings.
   */
  class GuildTemplate {
    /**
     * The template code used to reference this template.
     */
    readonly code: string;

    /**
     * When this template was created.
     */
    readonly createdAt: Date;

    /**
     * ID of the user who created this template, or `null`.
     */
    readonly creatorId: Snowflake | null;

    /**
     * Template description, or `null`.
     */
    readonly description: string | null;

    /**
     * Guild ID this template was created from.
     */
    readonly guildId: Snowflake;

    /**
     * Indicates whether the template is out of sync with the source guild, or `null`.
     */
    readonly isDirty: boolean | null;

    /**
     * Template name.
     */
    readonly name: string;

    /**
     * Source guild ID (for synced templates), or `null`.
     */
    readonly sourceGuildId: Snowflake | null;

    /**
     * When this template was last updated.
     */
    readonly updatedAt: Date;

    /**
     * Number of times this template has been used.
     */
    readonly usageCount: number;

    /**
     * Delete this template.
     *
     * @returns The deleted template object.
     */
    delete(): Promise<GuildTemplate>;

    /**
     * Edit template properties.
     *
     * @param options Template properties to update.
     * @returns The updated template.
     */
    edit(options: {
      description?: string | null;
      name?: string;
    }): Promise<GuildTemplate>;

    /**
     * Sync the template with the current guild state.
     *
     * @returns The updated template.
     */
    sync(): Promise<GuildTemplate>;
  }

  /**
   * Presence status string reported by Discord.
   */
  type PresenceStatus =
    | "online"
    | "idle"
    | "dnd"
    | "offline"
    | "invisible"
    | string;

  /**
   * Activity included in a Discord presence update.
   */
  interface PresenceActivity {
    /**
     * Application ID for this activity, when Discord includes one.
     */
    application_id?: Snowflake;

    /**
     * Image asset metadata for rich presence activities.
     */
    assets?: Record<string, unknown>;

    /**
     * Buttons displayed on this activity.
     */
    buttons?: unknown[];

    /**
     * Unix timestamp in milliseconds when this activity was added.
     */
    created_at?: number;

    /**
     * Activity details line, or `null` when not provided.
     */
    details?: string | null;

    /**
     * Emoji shown with a custom status, or `null` when not set.
     */
    emoji?: EmojiData | null;

    /**
     * Activity flags bitfield.
     */
    flags?: number;

    /**
     * Whether this activity is an instanced game session.
     */
    instance?: boolean;

    /**
     * Activity name shown by Discord.
     */
    name?: string;

    /**
     * Party metadata for rich presence activities.
     */
    party?: Record<string, unknown>;

    /**
     * Join/spectate secrets for rich presence activities.
     */
    secrets?: Record<string, unknown>;

    /**
     * Activity state text. For custom status, this is the custom status text.
     */
    state?: string | null;

    /**
     * Activity start/end timestamps supplied by Discord.
     */
    timestamps?: Record<string, unknown>;

    /**
     * Activity type such as playing, streaming, listening, watching, or custom.
     */
    type?: ActivityType;

    /**
     * Stream URL for streaming activities, or `null` when not applicable.
     */
    url?: string | null;
  }

  /**
   * Presence status split by Discord client platform.
   */
  interface ClientStatus {
    /**
     * Status reported by the desktop Discord client.
     */
    desktop?: PresenceStatus;

    /**
     * Status reported by the mobile Discord client.
     */
    mobile?: PresenceStatus;

    /**
     * Status reported by the web Discord client.
     */
    web?: PresenceStatus;
  }

  /**
   * Tracks a user's current gateway presence in a guild.
   * Presence data is cache-only and requires the privileged `GUILD_PRESENCES`
   * gateway intent. It may be absent until Discord sends a presence update.
   *
   * @see https://docs.discord.com/developers/events/gateway-events#presence-update
   */
  class Presence {
    /**
     * Current activities sent by Discord.
     */
    readonly activities: PresenceActivity[];

    /**
     * Per-platform status sent by Discord.
     */
    readonly clientStatus: ClientStatus;

    /**
     * Guild ID this presence belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Raw Discord presence payload.
     */
    readonly raw: Record<string, unknown>;

    /**
     * The user's current status.
     */
    readonly status: PresenceStatus;

    /**
     * User object from the presence update, or `null` when only cached status is available.
     */
    readonly user: User | null;

    /**
     * User ID this presence belongs to.
     */
    readonly userId: Snowflake;

    /**
     * Get the custom status activity, or `null` if not set.
     *
     * @returns The custom status activity object, or null.
     */
    getCustomStatus(): PresenceActivity | null;

    /**
     * Fetch the guild for this presence.
     */
    fetchGuild(): Promise<Guild>;

    /**
     * Fetch the guild member for this presence.
     */
    fetchMember(): Promise<GuildMember | null>;

    /**
     * Get the first non-custom activity, or `null` if none.
     *
     * @returns The primary activity object, or null.
     */
    getPrimaryActivity(): PresenceActivity | null;

    /**
     * Fetch the full user for this presence.
     */
    fetchUser(): Promise<User>;

    /**
     * Returns whether this presence is currently set to do-not-disturb.
     *
     * @returns Whether the check passed.
     */
    isDnd(): boolean;

    /**
     * Returns whether this presence is currently idle.
     *
     * @returns Whether the check passed.
     */
    isIdle(): boolean;

    /**
     * Returns whether this presence is currently offline.
     *
     * @returns Whether the check passed.
     */
    isOffline(): boolean;

    /**
     * Returns whether this presence is currently online.
     *
     * @returns Whether the check passed.
     */
    isOnline(): boolean;
  }

  /**
   * Tracks a user's current voice connection status in a guild, including channel, mute/deafen state, and stage suppression.
   */
  class VoiceState {
    /**
     * Channel ID the user is connected to, or `null` if not in voice.
     */
    readonly channelId: Snowflake | null;

    /**
     * Indicates whether the user is server-deafened.
     */
    readonly deaf: boolean;

    /**
     * Guild ID this voice state is for.
     */
    readonly guildId: Snowflake;

    /**
     * Guild member object for this user, or `null`.
     */
    readonly member: GuildMember | null;

    /**
     * Indicates whether the user is server-muted.
     */
    readonly mute: boolean;

    /**
     * Indicates whether the user has deafened themselves.
     */
    readonly selfDeaf: boolean;

    /**
     * Indicates whether the user has muted themselves.
     */
    readonly selfMute: boolean;

    /**
     * Indicates whether the user is streaming.
     */
    readonly selfStream: boolean;

    /**
     * Indicates whether the user's camera is enabled.
     */
    readonly selfVideo: boolean;

    /**
     * Session ID for the voice connection.
     */
    readonly sessionId: string;

    /**
     * Indicates whether the user is suppressed (in a stage).
     */
    readonly suppress: boolean;

    /** Stage request-to-speak time as a Unix timestamp in milliseconds. */
    readonly requestToSpeakTimestamp: number | null;

    /**
     * User ID of the connected user.
     */
    readonly userId: Snowflake;
  }

  /**
   * Wraps a single new value for audit log changes on creation events.
   */
  interface IActionChangeNewValue<T> {
    /**
     * The new value after the action.
     */
    readonly newValue: T;
  }

  /**
   * Wraps a single old value for audit log changes on deletion events.
   */
  interface IActionChangeOldValue<T> {
    /**
     * The value before deletion.
     */
    readonly oldValue: T;
  }

  /**
   * Contains both old and new values for an updated audit log property.
   */
  interface IActionChange<T> {
    /**
     * The value after the update.
     */
    readonly newValue: T;

    /**
     * The value before the update.
     */
    readonly oldValue?: T;
  }

  /**
   * Base class for all audit log entries. Use a subclass narrowed by `actionType` for typed change access.
   */
  class AuditLogEntry {
    /**
     * The type of action this entry represents.
     */
    readonly actionType: AuditLogActionType;

    /**
     * Raw changes object (use subclass for typed access).
     */
    readonly changes: Record<
      string,
      { readonly oldValue?: unknown; readonly newValue?: unknown }
    >;

    /** Additional action metadata supplied by Discord, or `null`. */
    readonly options: Record<string, unknown> | null;

    /**
     * The ID of the audit log entry.
     */
    readonly id: Snowflake;

    /**
     * Reason for the action, or `null` if not provided.
     */
    readonly reason: string | null;

    /**
     * The ID of the affected resource (user, channel, role, etc.), or `null`.
     */
    readonly targetId: Snowflake | null;

    /**
     * User who performed the audited action, or `null` if Discord omitted it.
     */
    readonly user: User | null;

    /**
     * The ID of the user who performed the action, or `null`.
     */
    readonly userId: Snowflake | null;

    /**
     * Creates the appropriate typed subclass based on `actionType`.
     */
    static create(data: Record<string, unknown>): AnyAuditLogEntry;
  }

  /**
   * A fetched guild audit log page, including entries and resolved related resources.
   */
  class AuditLog {
    /**
     * Application commands resolved by this audit log response.
     */
    readonly applicationCommands: unknown[];

    /**
     * Auto moderation rules resolved by this audit log response.
     */
    readonly autoModerationRules: AutoModRule[];

    /**
     * Audit log entries returned in this page.
     */
    readonly entries: AnyAuditLogEntry[];

    /**
     * Scheduled events resolved by this audit log response.
     */
    readonly guildScheduledEvents: ScheduledEvent[];

    /**
     * Integrations resolved by this audit log response.
     */
    readonly integrations: unknown[];

    /**
     * Unmodified raw audit log response from Discord.
     */
    readonly raw: unknown;

    /**
     * Threads resolved by this audit log response.
     */
    readonly threads: Channel[];

    /**
     * Users resolved by this audit log response.
     */
    readonly users: User[];

    /**
     * Webhooks resolved by this audit log response.
     */
    readonly webhooks: Webhook[];
  }

  /**
   * Audit log entry for a member kick action.
   */
  class MemberKickEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_KICK;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a member prune action.
   */
  class MemberPruneEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_PRUNE;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a member ban add action.
   */
  class MemberBanAddEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_BAN_ADD;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a member ban remove action.
   */
  class MemberBanRemoveEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_BAN_REMOVE;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a member update action, with typed change fields.
   */
  class MemberUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_UPDATE;

    readonly changes: {
      readonly communicationDisabledUntil?: IActionChange<string>;
      readonly deaf?: IActionChange<boolean>;
      readonly mute?: IActionChange<boolean>;
      readonly nick?: IActionChange<string>;
      readonly roles?: IActionChange<string[]>;
    };
  }

  /**
   * Audit log entry for a member role update (roles added/removed).
   */
  class MemberRoleUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_ROLE_UPDATE;

    readonly changes: {
      readonly $add?: IActionChangeNewValue<
        {
          id: Snowflake;
          name: string;
        }[]
      >;
      readonly $remove?: IActionChangeOldValue<
        {
          id: Snowflake;
          name: string;
        }[]
      >;
    };
  }

  class MemberMoveEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_MOVE;
    readonly changes: Record<string, never>;
  }

  class MemberDisconnectEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_DISCONNECT;
    readonly changes: Record<string, never>;
  }

  class BotAddEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.BOT_ADD;
    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a role creation action.
   */
  class RoleCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.ROLE_CREATE;

    readonly changes: {
      readonly color: IActionChangeNewValue<number>;
      readonly hoist: IActionChangeNewValue<boolean>;
      readonly mentionable: IActionChangeNewValue<boolean>;
      readonly name: IActionChangeNewValue<string>;
      readonly permissions: IActionChangeNewValue<bigint>;
    };
  }

  /**
   * Audit log entry for a role update action.
   */
  class RoleUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.ROLE_UPDATE;

    readonly changes: {
      readonly color?: IActionChange<number>;
      readonly hoist?: IActionChange<boolean>;
      readonly mentionable?: IActionChange<boolean>;
      readonly name?: IActionChange<string>;
      readonly permissions?: IActionChange<bigint>;
    };
  }

  /**
   * Audit log entry for a role deletion action.
   */
  class RoleDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.ROLE_DELETE;

    readonly changes: {
      readonly color: IActionChangeOldValue<number>;
      readonly hoist: IActionChangeOldValue<boolean>;
      readonly mentionable: IActionChangeOldValue<boolean>;
      readonly name: IActionChangeOldValue<string>;
      readonly permissions: IActionChangeOldValue<bigint>;
    };
  }

  /**
   * Audit log entry for a channel creation action.
   */
  class ChannelCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_CREATE;

    readonly changes: {
      readonly bitrate?: IActionChangeNewValue<number>;
      readonly name: IActionChangeNewValue<string>;
      readonly nsfw?: IActionChangeNewValue<boolean>;
      readonly rateLimitPerUser?: IActionChangeNewValue<number>;
      readonly topic?: IActionChangeNewValue<string>;
      readonly type: IActionChangeNewValue<number>;
    };
  }

  /**
   * Audit log entry for a channel update action.
   */
  class ChannelUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_UPDATE;

    readonly changes: {
      readonly bitrate?: IActionChange<number>;
      readonly name?: IActionChange<string>;
      readonly nsfw?: IActionChange<boolean>;
      readonly rateLimitPerUser?: IActionChange<number>;
      readonly topic?: IActionChange<string>;
    };
  }

  /**
   * Audit log entry for a channel deletion action.
   */
  class ChannelDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_DELETE;

    readonly changes: {
      readonly bitrate?: IActionChangeOldValue<number>;
      readonly name: IActionChangeOldValue<string>;
      readonly nsfw?: IActionChangeOldValue<boolean>;
      readonly rateLimitPerUser?: IActionChangeOldValue<number>;
      readonly topic?: IActionChangeOldValue<string>;
      readonly type: IActionChangeOldValue<number>;
    };
  }

  class ChannelPermissionOverwriteCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_OVERWRITE_CREATE;
    readonly changes: {
      readonly id: IActionChangeNewValue<Snowflake>;
      readonly type: IActionChangeNewValue<number>;
      readonly allow: IActionChangeNewValue<string>;
      readonly deny: IActionChangeNewValue<string>;
    };
  }

  class ChannelPermissionOverwriteUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_OVERWRITE_UPDATE;
    readonly changes: {
      readonly id?: IActionChange<Snowflake>;
      readonly type?: IActionChange<number>;
      readonly allow?: IActionChange<string>;
      readonly deny?: IActionChange<string>;
    };
  }

  class ChannelPermissionOverwriteDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_OVERWRITE_DELETE;
    readonly changes: {
      readonly id: IActionChangeOldValue<Snowflake>;
      readonly type: IActionChangeOldValue<number>;
      readonly allow: IActionChangeOldValue<string>;
      readonly deny: IActionChangeOldValue<string>;
    };
  }

  /**
   * Audit log entry for an emoji creation action.
   */
  class EmojiCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.EMOJI_CREATE;

    readonly changes: {
      readonly name: IActionChangeNewValue<string>;
    };
  }

  /**
   * Audit log entry for an emoji update action.
   */
  class EmojiUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.EMOJI_UPDATE;

    readonly changes: {
      readonly name?: IActionChange<string>;
    };
  }

  /**
   * Audit log entry for an emoji deletion action.
   */
  class EmojiDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.EMOJI_DELETE;

    readonly changes: {
      readonly name?: IActionChangeOldValue<string>;
    };
  }

  /**
   * Audit log entry for a guild update action.
   */
  class GuildUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.GUILD_UPDATE;

    readonly changes: {
      readonly afkChannelId?: IActionChange<string>;
      readonly afkTimeout?: IActionChange<number>;
      readonly defaultMessageNotification?: IActionChange<number>;
      readonly explicitContentFilter?: IActionChange<number>;
      readonly iconHash?: IActionChange<string>;
      readonly mfaLevel?: IActionChange<number>;
      readonly name?: IActionChange<string>;
      readonly ownerId?: IActionChange<Snowflake>;
      readonly region?: IActionChange<string>;
      readonly splashHash?: IActionChange<string>;
      readonly systemChannelId?: IActionChange<string>;
      readonly vanityUrlCode?: IActionChange<string>;
      readonly verificationLevel?: IActionChange<number>;
      readonly widgetChannelId?: IActionChange<string>;
      readonly widgetEnabled?: IActionChange<boolean>;
    };
  }

  /**
   * Audit log entry for an invite creation action.
   */
  class InviteCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INVITE_CREATE;

    readonly changes: {
      readonly channelId: IActionChangeNewValue<Snowflake>;
      readonly code: IActionChangeNewValue<string>;
      readonly inviterId: IActionChangeNewValue<Snowflake>;
      readonly maxAge: IActionChangeNewValue<number>;
      readonly maxUses: IActionChangeNewValue<number>;
      readonly temporary: IActionChangeNewValue<boolean>;
      readonly uses: IActionChangeNewValue<number>;
    };
  }

  /**
   * Audit log entry for an invite update action.
   */
  class InviteUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INVITE_UPDATE;

    readonly changes: {
      readonly channelId?: IActionChange<Snowflake>;
      readonly code?: IActionChange<string>;
      readonly inviterId?: IActionChange<Snowflake>;
      readonly maxAge?: IActionChange<number>;
      readonly maxUses?: IActionChange<number>;
      readonly temporary?: IActionChange<boolean>;
      readonly uses?: IActionChange<number>;
    };
  }

  /**
   * Audit log entry for an invite deletion action.
   */
  class InviteDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INVITE_DELETE;

    readonly changes: {
      readonly channelId: IActionChangeOldValue<Snowflake>;
      readonly code: IActionChangeOldValue<string>;
      readonly inviterId: IActionChangeOldValue<Snowflake>;
      readonly maxAge: IActionChangeOldValue<number>;
      readonly maxUses: IActionChangeOldValue<number>;
      readonly temporary: IActionChangeOldValue<boolean>;
      readonly uses: IActionChangeOldValue<number>;
    };
  }

  /**
   * Audit log entry for a webhook creation action.
   */
  class WebhookCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.WEBHOOK_CREATE;

    readonly changes: {
      readonly avatarHash?: IActionChangeNewValue<string>;
      readonly channelId: IActionChangeNewValue<Snowflake>;
      readonly name: IActionChangeNewValue<string>;
      readonly type: IActionChangeNewValue<number>;
    };
  }

  /**
   * Audit log entry for a webhook update action.
   */
  class WebhookUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.WEBHOOK_UPDATE;

    readonly changes: {
      readonly avatarHash?: IActionChange<string>;
      readonly channelId?: IActionChange<Snowflake>;
      readonly name?: IActionChange<string>;
      readonly type?: IActionChange<number>;
    };
  }

  /**
   * Audit log entry for a webhook deletion action.
   */
  class WebhookDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.WEBHOOK_DELETE;

    readonly changes: {
      readonly avatarHash?: IActionChangeOldValue<string>;
      readonly channelId: IActionChangeOldValue<Snowflake>;
      readonly name: IActionChangeOldValue<string>;
      readonly type: IActionChangeOldValue<number>;
    };
  }

  /**
   * Audit log entry for a message deletion action.
   */
  class MessageDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_DELETE;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a bulk message deletion action.
   */
  class MessageBulkDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_BULK_DELETE;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a message pin action.
   */
  class MessagePinEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_PIN;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for a message unpin action.
   */
  class MessageUnpinEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_UNPIN;

    readonly changes: Record<string, never>;
  }

  /**
   * Audit log entry for an integration creation action.
   */
  class IntegrationCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INTEGRATION_CREATE;

    readonly changes: {
      readonly enableEmoticons?: IActionChangeNewValue<boolean>;
      readonly expireBehavior: IActionChangeNewValue<number>;
      readonly expireGracePeriod: IActionChangeNewValue<number>;
      readonly name: IActionChangeNewValue<string>;
      readonly type: IActionChangeNewValue<"twitch" | "youtube">;
    };
  }

  /**
   * Audit log entry for an integration update action.
   */
  class IntegrationUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INTEGRATION_UPDATE;

    readonly changes: {
      readonly enableEmoticons?: IActionChange<boolean>;
      readonly expireBehavior?: IActionChange<number>;
      readonly expireGracePeriod?: IActionChange<number>;
      readonly name?: IActionChange<string>;
      readonly type?: IActionChange<"twitch" | "youtube">;
    };
  }

  /**
   * Audit log entry for an integration deletion action.
   */
  class IntegrationDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INTEGRATION_DELETE;

    readonly changes: {
      readonly enableEmoticons?: IActionChangeOldValue<boolean>;
      readonly expireBehavior: IActionChangeOldValue<number>;
      readonly expireGracePeriod: IActionChangeOldValue<number>;
      readonly name: IActionChangeOldValue<string>;
      readonly type: IActionChangeOldValue<"twitch" | "youtube">;
    };
  }

  /**
   * Audit log entry for an auto moderation rule creation action.
   */
  class AutoModRuleCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.AUTO_MODERATION_RULE_CREATE;

    readonly changes: {
      readonly enabled: IActionChangeNewValue<boolean>;
      readonly eventType: IActionChangeNewValue<number>;
      readonly name: IActionChangeNewValue<string>;
      readonly triggerType: IActionChangeNewValue<number>;
    };
  }

  /**
   * Audit log entry for an auto moderation rule update action.
   */
  class AutoModRuleUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.AUTO_MODERATION_RULE_UPDATE;

    readonly changes: {
      readonly enabled?: IActionChange<boolean>;
      readonly name?: IActionChange<string>;
      readonly triggerMetadata?: IActionChange<AutoModTriggerMetadata>;
    };
  }

  /**
   * Audit log entry for an auto moderation rule deletion action.
   */
  class AutoModRuleDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.AUTO_MODERATION_RULE_DELETE;

    readonly changes: Record<string, never>;
  }

  /**
   * Union of all typed audit log entry types.
   */
  type AnyAuditLogEntry =
    | MemberKickEntry
    | MemberPruneEntry
    | MemberBanAddEntry
    | MemberBanRemoveEntry
    | MemberUpdateEntry
    | MemberRoleUpdateEntry
    | MemberMoveEntry
    | MemberDisconnectEntry
    | BotAddEntry
    | RoleCreateEntry
    | RoleUpdateEntry
    | RoleDeleteEntry
    | ChannelCreateEntry
    | ChannelUpdateEntry
    | ChannelDeleteEntry
    | ChannelPermissionOverwriteCreateEntry
    | ChannelPermissionOverwriteUpdateEntry
    | ChannelPermissionOverwriteDeleteEntry
    | EmojiCreateEntry
    | EmojiUpdateEntry
    | EmojiDeleteEntry
    | GuildUpdateEntry
    | InviteCreateEntry
    | InviteUpdateEntry
    | InviteDeleteEntry
    | WebhookCreateEntry
    | WebhookUpdateEntry
    | WebhookDeleteEntry
    | MessageDeleteEntry
    | MessageBulkDeleteEntry
    | MessagePinEntry
    | MessageUnpinEntry
    | IntegrationCreateEntry
    | IntegrationUpdateEntry
    | IntegrationDeleteEntry
    | AutoModRuleCreateEntry
    | AutoModRuleUpdateEntry
    | AutoModRuleDeleteEntry
    | AuditLogEntry;

  /**
   * An interaction received from Discord, including application commands, components, autocomplete requests, and modal submissions.
   * Use the `is*()` guards before reading fields that only exist for one interaction
   * kind. Discord requires an initial response or defer within three seconds.
   *
   * #### Example
   * ```ts
   * discord.on(discord.events.INTERACTION_CREATE, async (interaction) => {
   *   if (!interaction.isButton() || interaction.customId !== 'refresh') return;
   *   await interaction.update({ content: 'Refreshed.' });
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/interactions/receiving-and-responding
   */
  class Interaction {
    /**
     * Bitmask of the bot's permissions (as a decimal string).
     */
    readonly appPermissions: string | null;

    /**
     * Channel ID the interaction occurred in, or `null`.
     */
    readonly channelId: Snowflake | null;

    /**
     * The name of the invoked command, or `null` for non-command interactions.
     */
    readonly commandName: string | null;

    /**
     * The type of component (button, select, etc.), or `null`.
     */
    readonly componentType: ComponentType | null;

    /**
     * The custom ID of the component or modal, or `null`.
     */
    readonly customId: string | null;

    /**
     * Entitlements for this interaction (SKU purchases).
     */
    readonly entitlements: unknown[];

    /**
     * Guild ID the interaction occurred in, or `null` when Discord omits it.
     */
    readonly guildId: Snowflake | null;

    /**
     * The guild's preferred locale, or `null` when Discord omits it.
     */
    readonly guildLocale: string | null;

    /**
     * Discord snowflake ID.
     */
    readonly id: Snowflake;

    /**
     * The preferred locale of the interacting user.
     */
    readonly locale: string | null;

    /**
     * The guild member who triggered the interaction, or `null`.
     */
    readonly member: GuildMember | null;

    /**
     * The message the interaction was on (for component interactions), or `null`.
     */
    readonly message: Message | null;

    /**
     * Target ID for context menu interactions, or `null`.
     */
    readonly targetId: Snowflake | null;

    /**
     * Interaction token for responding (used internally by reply/followup methods).
     */
    readonly token: string;

    /**
     * The type of interaction.
     */
    readonly type: InteractionType;

    /**
     * User included in this payload.
     */
    readonly user: User | null;

    /**
     * Selected values from select menus.
     */
    readonly values: string[];

    /**
     * Respond with autocomplete choices.
     *
     * @param choices The list of autocomplete suggestions to show.
     */
    autocompleteReply(choices: CommandChoice[]): Promise<void>;

    /**
     * Acknowledge the interaction and show a loading state.
     * Call {@link editReply} after the long-running work finishes.
     *
     * @param options Optional defer settings (e.g. `ephemeral`).
     */
    defer(options?: { ephemeral?: boolean }): Promise<void>;

    /**
     * Acknowledge a component interaction without editing the message.
     */
    deferUpdate(): Promise<void>;

    /**
     * Delete a follow-up message.
     *
     * @param messageId The ID of the follow-up message to delete.
     */
    deleteFollowup(messageId: Snowflake): Promise<void>;

    /**
     * Delete the initial reply.
     *
     * @param messageId Specific message ID to delete (defaults to initial reply).
     */
    deleteReply(messageId?: Snowflake): Promise<void>;

    /**
     * Edit the initial reply to this interaction.
     *
     * @param body New message content or edit options.
     * @param messageId Specific message ID to edit (defaults to initial reply).
     * @returns The edited message.
     */
    editReply(
      body: string | EditMessageOptions,
      messageId?: Snowflake,
    ): Promise<Message>;

    /**
     * Fetch the initial reply.
     *
     * @param messageId Specific message ID to fetch (defaults to initial reply).
     * @returns The fetched message.
     */
    fetchReply(messageId?: Snowflake): Promise<Message>;

    /**
     * Send a follow-up message after the initial interaction reply.
     *
     * @param body Message content or send options.
     * @returns The sent message.
     */
    followup(
      body:
        | string
        | (SendMessageOptions & {
            ephemeral?: boolean;
          }),
    ): Promise<Message>;

    /**
     * Get whether a checkbox is checked.
     *
     * @param customId The custom ID of the checkbox.
     * @returns `true` if the checkbox is checked.
     */
    getCheckbox(customId: string): boolean;

    /**
     * Get the values of all checked checkboxes in a checkbox group.
     *
     * @param customId The custom ID of the checkbox group.
     * @returns Array of checked checkbox values.
     */
    getCheckboxValues(customId: string): string[];

    /**
     * Get the file attachment from a file upload component.
     *
     * @param customId The custom ID of the file upload component.
     * @returns The attachment, or `null` if not found.
     */
    getFile(customId: string): Attachment | null;

    /**
     * Get all file attachments from a file upload component.
     *
     * @param customId The custom ID of the file upload component.
     * @returns Array of attachments.
     */
    getFiles(customId: string): Attachment[];

    /**
     * Get a typed option parser for command options.
     */
    getOptions(): InteractionOptionParser;

    /**
     * Get the selected value of a radio group.
     *
     * @param customId The custom ID of the radio group.
     * @returns The selected value, or `null` if not found.
     */
    getRadioValue(customId: string): string | null;

    /**
     * Get the value of a text input in a modal submission.
     *
     * @param customId The custom ID of the text input component.
     * @returns The input value, or `null` if not found.
     */
    getTextInput(customId: string): string | null;

    /**
     * Returns whether this interaction requests application-command autocomplete choices.
     */
    isAutocomplete(): this is this & {
      type: typeof InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE;
    };

    /**
     * Checks whether this interaction came from a button component.
     *
     * @returns Whether the interaction matches this component type.
     */
    isButton(): this is this & {
      componentType: typeof ComponentType.BUTTON;
      customId: string;
      message: Message | null;
    };

    /**
     * Checks whether this interaction came from a channel select menu.
     *
     * @returns Whether the interaction matches this component type.
     */
    isChannelSelect(): this is this & {
      componentType: typeof ComponentType.CHANNEL_SELECT;
      customId: string;
    };

    /**
     * Returns whether this is an application-command interaction and narrows `commandName`.
     */
    isCommand(): this is this & {
      commandName: string;
    };

    /**
     * Returns whether this came from a message or modal component and narrows its component fields.
     */
    isComponent(): this is this & {
      componentType: ComponentType;
      customId: string;
    };

    /**
     * Checks whether this interaction came from a mentionable select menu.
     *
     * @returns Whether the interaction matches this component type.
     */
    isMentionableSelect(): this is this & {
      componentType: typeof ComponentType.MENTIONABLE_SELECT;
      customId: string;
    };

    /**
     * Returns whether this is a message context-menu command and narrows `targetId`.
     */
    isMessageContextMenu(): this is this & {
      commandName: string;
      targetId: Snowflake;
      type: typeof InteractionType.APPLICATION_COMMAND;
    };

    /**
     * Returns whether this is a modal submission and narrows `customId`.
     */
    isModalSubmit(): this is this & {
      customId: string;
    };

    /**
     * Checks whether this interaction came from a role select menu.
     *
     * @returns Whether the interaction matches this component type.
     */
    isRoleSelect(): this is this & {
      componentType: typeof ComponentType.ROLE_SELECT;
      customId: string;
    };

    /**
     * Checks whether this interaction came from a string select menu.
     *
     * @returns Whether the interaction matches this component type.
     */
    isStringSelect(): this is this & {
      componentType: typeof ComponentType.STRING_SELECT;
      customId: string;
    };

    /**
     * Returns whether this is a user context-menu command and narrows `targetId`.
     */
    isUserContextMenu(): this is this & {
      commandName: string;
      targetId: Snowflake;
      type: typeof InteractionType.APPLICATION_COMMAND;
    };

    /**
     * Checks whether this interaction came from a user select menu.
     *
     * @returns Whether the interaction matches this component type.
     */
    isUserSelect(): this is this & {
      componentType: typeof ComponentType.USER_SELECT;
      customId: string;
    };

    /**
     * Reply to this interaction (when `wait: true` is set, returns the created message).
     * This consumes the initial interaction response. Use {@link followup} for later messages.
     *
     * @param body Message content or interaction reply options.
     */
    reply(
      body:
        | string
        | (InteractionReplyOptions & {
            wait?: false;
          }),
    ): Promise<void>;

    /**
     * Reply to this interaction with `wait: true` to get the sent message.
     *
     * @param body Message content or interaction reply options.
     * @returns The sent message.
     */
    reply(
      body:
        | string
        | (InteractionReplyOptions & {
            wait: true;
          }),
    ): Promise<Message>;

    /**
     * Show a modal to the user.
     *
     * @param modal Modal configuration with title and components.
     */
    showModal(modal: {
      components: Component[];
      customId: string;
      title: string;
    }): Promise<void>;

    /**
     * Update the original interaction message (for component interactions).
     *
     * @param body Message content or interaction reply options.
     */
    update(body: string | InteractionReplyOptions): Promise<void>;
  }

  /**
   * Typed access to options resolved from an application-command interaction.
   * Missing optional values return `null`; required option providers make the
   * corresponding handler argument non-null at compile time.
   */
  class InteractionOptionParser {
    /**
     * Get an attachment option value.
     *
     * @param name The option name.
     * @returns The resolved attachment, or `null` if not provided.
     */
    getAttachment(name: string): Attachment | null;

    /**
     * Get a boolean option value.
     *
     * @param name The option name.
     * @returns The option value, or `null` if not provided.
     */
    getBoolean(name: string): boolean | null;

    /**
     * Get a channel option value.
     *
     * @param name The option name.
     * @returns The resolved channel, or `null` if not provided.
     */
    getChannel(name: string): AnyGuildChannel | null;

    /**
     * Get the currently focused option value for autocomplete interactions.
     *
     * @returns The focused option value, or `null` if none is focused.
     */
    getFocused(): string | null;

    /**
     * Get an integer option value.
     *
     * @param name The option name.
     * @returns The option value, or `null` if not provided.
     */
    getInteger(name: string): number | null;

    /**
     * Get a guild member option value.
     *
     * @param name The option name.
     * @returns The resolved guild member, or `null` if not provided.
     */
    getMember(name: string): GuildMember | null;

    /**
     * Get a number (float) option value.
     *
     * @param name The option name.
     * @returns The option value, or `null` if not provided.
     */
    getNumber(name: string): number | null;

    /**
     * Get a role option value.
     *
     * @param name The option name.
     * @returns The resolved role, or `null` if not provided.
     */
    getRole(name: string): Role | null;

    /**
     * Get a string option value.
     *
     * @param name The option name.
     * @returns The option value, or `null` if not provided.
     */
    getString(name: string): string | null;

    /**
     * Get a user option value.
     *
     * @param name The option name.
     * @returns The resolved user, or `null` if not provided.
     */
    getUser(name: string): User | null;
  }

  /**
   * Options for replying to an interaction.
   */
  interface InteractionReplyOptions {
    /**
     * Controls which mentions are delivered.
     */
    allowedMentions?: AllowedMentions;

    /**
     * Interactive components.
     */
    components?: Component[];

    /**
     * Message body text.
     */
    content?: string;

    /**
     * Rich embeds to attach.
     */
    embeds?: EmbedLike[];

    /**
     * Indicates whether this reply should only be visible to the interacting user.
     */
    ephemeral?: boolean;

    /**
     * Files to upload.
     */
    files?: AttachmentInput[];

    /**
     * Poll to include with the reply.
     */
    poll?: PollCreateOptions;

    /**
     * Indicates whether this is a text-to-speech message.
     */
    tts?: boolean;
  }

  /** A labeled value returned by a slash-command autocomplete provider. */
  interface AutocompleteChoice<T extends string | number = string | number> {
    name: string;
    value: T;
  }

  /** A fixed slash-command choice registered with Discord. */
  interface OptionChoice<T extends string | number = string | number> {
    name: string;
    value: T;
    nameLocalizations?: LocaleMap;
  }

  /**
   * Configures one slash-command option. The schema key becomes the handler
   * argument name; use {@link discordName} only when Discord should receive a
   * different option name.
   */
  class CommandOption<
    TValue,
    TOptional extends boolean = false,
    TKind extends string = string,
  > {
    readonly kind: TKind;
    /** Makes this option optional. Its handler value becomes `TValue | null`. */
    optional(): CommandOption<TValue, true, TKind>;
    /** Sets the option name registered with Discord. */
    discordName(name: string): CommandOption<TValue, TOptional, TKind>;
    minLength(
      this: CommandOption<TValue, TOptional, "string">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    maxLength(
      this: CommandOption<TValue, TOptional, "string">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    minValue(
      this: CommandOption<TValue, TOptional, "integer" | "number">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    maxValue(
      this: CommandOption<TValue, TOptional, "integer" | "number">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    channelTypes(
      this: CommandOption<TValue, TOptional, "channel">,
      types: number[],
    ): CommandOption<TValue, TOptional, TKind>;
    choices(
      this: CommandOption<TValue, TOptional, "string" | "integer" | "number">,
      ...choices: Array<TValue | OptionChoice<Extract<TValue, string | number>>>
    ): CommandOption<TValue, TOptional, TKind>;
    localizations(values: {
      name?: LocaleMap;
      description?: LocaleMap;
    }): CommandOption<TValue, TOptional, TKind>;
    autocomplete(
      this: CommandOption<TValue, TOptional, "string" | "integer" | "number">,
      provider: TValue extends string | number
        ? (context: {
            interaction: Interaction;
            value: TValue;
          }) =>
            | Array<TValue | AutocompleteChoice<TValue>>
            | Promise<Array<TValue | AutocompleteChoice<TValue>>>
        : never,
    ): CommandOption<TValue, TOptional, TKind>;
  }

  /** Context passed to a custom prefix-command argument parser. */
  interface CustomArgumentContext {
    readonly message: GuildMemberMessage;
    readonly commandName: string;
    readonly argument: string;
    fail(message: string): never;
  }

  type CustomArgumentParser<TValue> = (
    input: string,
    context: CustomArgumentContext,
  ) => TValue | Promise<TValue>;

  /** Configures one positional prefix-command argument. */
  class CommandArgument<TValue, TOptional extends boolean = false> {
    /** Makes this argument optional and optionally supplies its omitted value. */
    optional(defaultValue?: TValue | null): CommandArgument<TValue, true>;
  }

  type CommandPermissionRequirement =
    | readonly PermissionFlag[]
    | {
        allOf?: readonly PermissionFlag[];
        anyOf?: readonly PermissionFlag[];
      };

  /** Permission requirements checked before command arguments are resolved. */
  interface CommandPermissions {
    user?: CommandPermissionRequirement;
    bot?: CommandPermissionRequirement;
  }

  type CommandCooldownScope = "user" | "channel" | "guild";
  /**
   * A distributed command cooldown. A number is a user-scoped duration in
   * milliseconds; the object form selects the scope explicitly.
   */
  type CommandCooldown =
    | number
    | {
        durationMs: number;
        scope: CommandCooldownScope;
      };

  /**
   * Runs before permission checks and argument resolution. Return `true` or
   * `undefined` to continue, `false` to stop silently, or a string to stop and reply.
   */
  interface CommandFilter {
    check(
      context:
        | {
            kind: "slash";
            commandName: string;
            commandPath: readonly string[];
            interaction: Interaction;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          }
        | {
            kind: "prefix";
            commandName: string;
            commandPath: readonly string[];
            message: GuildMemberMessage;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          }
        | {
            kind: "menu";
            commandName: string;
            commandPath: readonly string[];
            interaction: Interaction;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          },
    ): boolean | string | void | Promise<boolean | string | void>;
  }

  type CommandInputErrorCode =
    | "required"
    | "invalid_syntax"
    | "unexpected_argument"
    | "invalid_integer"
    | "invalid_number"
    | "invalid_duration"
    | "invalid_reference"
    | "not_found"
    | "custom";

  /** Invalid user input routed to the application's `onInputError` handler. */
  class CommandInputError extends Error {
    readonly code: CommandInputErrorCode;
    readonly commandName: string;
    readonly argument: string;
    readonly received?: string;
    readonly usage?: string;
  }

  type CommandErrorHandler = (
    error: unknown,
    context: Parameters<CommandFilter["check"]>[0],
  ) => void | Promise<void>;

  type CommandInputErrorHandler = (
    error: CommandInputError,
    context: Parameters<CommandFilter["check"]>[0],
  ) => void | Promise<void>;

  /**
   * Registers prefix, slash, and context-menu commands during module loading.
   * Schema keys are inferred as the handler's argument object.
   */
  namespace commands {
    /** Creates slash-command option descriptors. */
    interface OptionBuilder {
      string(description: string): CommandOption<string, false, "string">;
      integer(description: string): CommandOption<number, false, "integer">;
      number(description: string): CommandOption<number, false, "number">;
      boolean(description: string): CommandOption<boolean, false, "boolean">;
      user(description: string): CommandOption<User, false, "user">;
      member(description: string): CommandOption<GuildMember, false, "member">;
      channel(
        description: string,
      ): CommandOption<AnyGuildChannel, false, "channel">;
      role(description: string): CommandOption<Role, false, "role">;
      attachment(
        description: string,
      ): CommandOption<Attachment, false, "attachment">;
    }

    type OptionMap = Record<string, CommandOption<any, any, any>>;
    type InferOptions<TSchema extends OptionMap> = {
      [TKey in keyof TSchema]: TSchema[TKey] extends CommandOption<
        infer TValue,
        infer TOptional,
        any
      >
        ? TOptional extends true
          ? TValue | null
          : TValue
        : never;
    };

    /** Creates positional prefix-command argument descriptors. */
    interface ArgumentBuilder {
      string(description: string): CommandArgument<string>;
      integer(description: string): CommandArgument<number>;
      number(description: string): CommandArgument<number>;
      duration(description: string): CommandArgument<number>;
      rest(description: string): CommandArgument<string>;
      user(description: string): CommandArgument<User>;
      member(description: string): CommandArgument<GuildMember>;
      channel(description: string): CommandArgument<AnyGuildChannel>;
      role(description: string): CommandArgument<Role>;
      custom<TValue>(
        description: string,
        parser: CustomArgumentParser<TValue>,
      ): CommandArgument<TValue>;
    }

    type ArgumentMap = Record<string, CommandArgument<any, any>>;
    type InferArguments<TSchema extends ArgumentMap> = {
      [TKey in keyof TSchema]: TSchema[TKey] extends CommandArgument<
        infer TValue,
        infer TOptional
      >
        ? TOptional extends true
          ? TValue | null
          : TValue
        : never;
    };

    /** Configuration sent to Discord for a slash command. */
    interface SlashConfig<TSchema extends OptionMap = Record<never, never>> {
      name: string;
      description: string;
      nameLocalizations?: LocaleMap;
      descriptionLocalizations?: LocaleMap;
      defaultMemberPermissions?: PermissionFlag | null;
      nsfw?: boolean;
      options?: (option: OptionBuilder) => TSchema;
      filters?: CommandFilter[];
      permissions?: CommandPermissions;
      cooldown?: CommandCooldown;
    }

    /** Configuration for a message-based prefix command. */
    interface PrefixConfig<TSchema extends ArgumentMap = Record<never, never>> {
      name: string;
      aliases?: string[];
      prefixes?: string[];
      description?: string;
      args?: (argument: ArgumentBuilder) => TSchema;
      filters?: CommandFilter[];
      permissions?: CommandPermissions;
      cooldown?: CommandCooldown;
    }

    /** Shared registration settings for a slash-command group. */
    interface GroupConfig {
      name: string;
      description: string;
      nameLocalizations?: LocaleMap;
      descriptionLocalizations?: LocaleMap;
      filters?: CommandFilter[];
      permissions?: CommandPermissions;
    }

    interface Group {
      slash<TSchema extends OptionMap = Record<never, never>>(
        config: SlashConfig<TSchema>,
        handler: (
          interaction: Interaction,
          args: InferOptions<TSchema>,
        ) => Promise<unknown>,
      ): { name: string; description: string };
      group(config: GroupConfig): Group;
    }

    /** A command registry created for one script. */
    interface CommandApplication extends Group {
      prefix<TSchema extends ArgumentMap = Record<never, never>>(
        config: PrefixConfig<TSchema>,
        handler: (
          message: GuildMemberMessage,
          args: InferArguments<TSchema>,
        ) => Promise<unknown>,
      ): { name: string };
      readonly menu: {
        user(
          name: string,
          handler: (
            interaction: Interaction,
            target: User | GuildMember | null,
          ) => Promise<unknown>,
        ): void;
        user(
          config: {
            name: string;
            nameLocalizations?: LocaleMap;
            defaultMemberPermissions?: PermissionFlag | null;
            nsfw?: boolean;
            filters?: CommandFilter[];
            permissions?: CommandPermissions;
            cooldown?: CommandCooldown;
          },
          handler: (
            interaction: Interaction,
            target: User | GuildMember | null,
          ) => Promise<unknown>,
        ): void;
        message(
          name: string,
          handler: (
            interaction: Interaction,
            target: Message | null,
          ) => Promise<unknown>,
        ): void;
        message(
          config: {
            name: string;
            nameLocalizations?: LocaleMap;
            defaultMemberPermissions?: PermissionFlag | null;
            nsfw?: boolean;
            filters?: CommandFilter[];
            permissions?: CommandPermissions;
            cooldown?: CommandCooldown;
          },
          handler: (
            interaction: Interaction,
            target: Message | null,
          ) => Promise<unknown>,
        ): void;
      };
      list(): Array<{
        kind: "slash" | "prefix" | "menu";
        name: string;
        path: string[];
        description?: string;
        aliases: string[];
      }>;
    }

    /**
     * Creates a command registry. Application filters and permissions run before
     * command-specific ones. Unexpected failures go to `onError`; user input
     * failures go to `onInputError`.
     */
    function create(options?: {
      prefixes?: string[];
      mentionPrefix?: boolean;
      filters?: CommandFilter[];
      permissions?: CommandPermissions;
      onError?: CommandErrorHandler;
      onInputError?: CommandInputErrorHandler;
    }): CommandApplication;
  }

  const filters: {
    readonly custom: (check: CommandFilter["check"]) => CommandFilter;
    readonly guildOnly: (message?: string) => CommandFilter;
    readonly hasRole: (roleId: Snowflake) => CommandFilter;
    readonly hasAnyRole: (...roleIds: Snowflake[]) => CommandFilter;
    readonly hasAllRoles: (...roleIds: Snowflake[]) => CommandFilter;
    readonly allowUsers: (...userIds: Snowflake[]) => CommandFilter;
    readonly and: (...items: CommandFilter[]) => CommandFilter;
    readonly or: (...items: CommandFilter[]) => CommandFilter;
    readonly not: (item: CommandFilter) => CommandFilter;
    readonly withMessage: (
      item: CommandFilter,
      message: string,
    ) => CommandFilter;
    readonly silent: (item: CommandFilter) => CommandFilter;
  };

  interface GenericComponent {
    type: number;
    [key: string]: unknown;
  }

  interface ActionRowComponent {
    type: typeof ComponentType.ACTION_ROW;
    components: Component[];
  }

  interface ButtonComponent {
    type: typeof ComponentType.BUTTON;
    style: number;
    label?: string;
    emoji?: EmojiData;
    custom_id?: string;
    url?: string;
    disabled?: boolean;
  }

  interface StringSelectComponent {
    type: typeof ComponentType.STRING_SELECT;
    custom_id: string;
    options: SelectOption[];
    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
  }

  interface TextInputComponent {
    type: typeof ComponentType.TEXT_INPUT;
    custom_id: string;
    label: string;
    style: number;
    required: boolean;
    min_length?: number;
    max_length?: number;
    value?: string;
    placeholder?: string;
  }

  interface TextDisplayComponent {
    type: typeof ComponentType.TEXT_DISPLAY;
    content: string;
  }

  interface ModalComponent {
    custom_id: string;
    title: string;
    components: Component[];
  }

  type Component =
    | ActionRowComponent
    | ButtonComponent
    | StringSelectComponent
    | TextInputComponent
    | TextDisplayComponent
    | GenericComponent;

  /**
   * Options for a link button component.
   */
  type LinkButtonOptions = {
    disabled?: boolean;
    emoji?: EmojiData;
    label?: string;
    style: typeof ButtonStyle.LINK;
    url: string;
  };

  /**
   * Options for a custom-ID button component.
   */
  type CustomButtonOptions = {
    customId: string;
    disabled?: boolean;
    emoji?: EmojiData;
    label?: string;
    style?: Exclude<ButtonStyle, typeof ButtonStyle.LINK>;
  };

  /**
   * Options accepted by button component builders.
   */
  type ButtonOptions = LinkButtonOptions | CustomButtonOptions;

  /**
   * Option displayed in a select menu.
   */
  interface SelectOption {
    /**
     * Indicates whether this option is pre-selected by default.
     */
    default?: boolean;

    /**
     * Optional description shown below the label.
     */
    description?: string;

    /**
     * Optional emoji shown next to the option.
     */
    emoji?: EmojiData;

    /**
     * User-visible label for the option.
     */
    label: string;

    /**
     * Dev-facing value returned on selection.
     */
    value: string;
  }

  /**
   * Shared options for select menu components.
   */
  interface SelectOptions {
    /**
     * Custom ID for the select menu.
     */
    customId: string;

    /**
     * Indicates whether the select menu is disabled.
     */
    disabled?: boolean;

    /**
     * Maximum number of items that can be selected.
     */
    maxValues?: number;

    /**
     * Minimum number of items that must be selected.
     */
    minValues?: number;

    /**
     * Placeholder text when nothing is selected.
     */
    placeholder?: string;
  }

  /**
   * Options for a string select menu.
   */
  interface StringSelectOptions extends SelectOptions {
    /**
     * The options shown in the dropdown.
     */
    options: SelectOption[];
  }

  /**
   * Options for a channel select menu.
   */
  interface ChannelSelectOptions extends SelectOptions {
    /**
     * Filter which channel types appear in the list.
     */
    channelTypes?: ChannelType[];
  }

  /**
   * Options for a modal text input.
   */
  interface TextInputOptions {
    /**
     * Custom ID for the text input.
     */
    customId: string;

    /**
     * Label displayed above the input field.
     */
    label: string;

    /**
     * Maximum character length.
     */
    maxLength?: number;

    /**
     * Minimum character length.
     */
    minLength?: number;

    /**
     * Placeholder text shown when the input is empty.
     */
    placeholder?: string;

    /**
     * Indicates whether this input is required.
     */
    required?: boolean;

    /**
     * Visual style (single-line vs paragraph).
     */
    style?: TextInputStyle;

    /**
     * Pre-filled value.
     */
    value?: string;
  }

  /**
   * Options for a radio group component.
   */
  interface RadioGroupOptions {
    /**
     * Custom ID for the radio group.
     */
    customId: string;

    /**
     * Description displayed below the label.
     */
    description?: string;

    /**
     * Label displayed above the radio group in a modal.
     */
    label?: string;

    /**
     * Radio options the user can pick from.
     */
    options: Array<{
      checked?: boolean;
      customId?: string;
      default?: boolean;
      description?: string;
      emoji?: EmojiData;
      label: string;
      value?: string;
    }>;

    /**
     * Indicates whether selecting an option is required.
     */
    required?: boolean;
  }

  /**
   * Options for a checkbox group component.
   */
  interface CheckboxGroupOptions {
    /**
     * Custom ID for the checkbox group.
     */
    customId: string;

    /**
     * Description displayed below the label.
     */
    description?: string;

    /**
     * Label displayed above the checkbox group in a modal.
     */
    label?: string;

    /**
     * Maximum number of options that can be selected.
     */
    maxValues?: number;

    /**
     * Minimum number of options that must be selected.
     */
    minValues?: number;

    /**
     * Individual checkboxes in the group.
     */
    options: CheckboxOptions[];

    /**
     * Indicates whether selecting within the group is required.
     */
    required?: boolean;
  }

  /**
   * Options for a single checkbox component.
   */
  interface CheckboxOptions {
    /**
     * Indicates whether the checkbox is pre-checked.
     */
    checked?: boolean;

    /**
     * Custom ID for a standalone checkbox, or value for a checkbox group option.
     */
    customId?: string;

    /**
     * Indicates whether the checkbox is pre-checked.
     */
    default?: boolean;

    /**
     * Description shown below the label.
     */
    description?: string;

    /**
     * Optional emoji shown next to the label.
     */
    emoji?: EmojiData;

    /**
     * Label displayed next to the checkbox. Required for checkbox group options; standalone checkboxes can fall back to customId.
     */
    label?: string;

    /**
     * Indicates whether this checkbox must be checked.
     */
    required?: boolean;

    /**
     * Value for a checkbox group option.
     */
    value?: string;
  }

  /**
   * Builders for Discord message components and modal form controls.
   * Builders return serializable component payloads; attach them to a message or
   * pass modal controls to {@link Interaction.showModal}.
   *
   * #### Example
   * ```ts
   * await interaction.reply({
   *   content: 'Choose an action.',
   *   components: [
   *     discord.components.actionRow(
   *       discord.components.button({
   *         customId: 'confirm',
   *         label: 'Confirm',
   *         style: discord.ButtonStyle.SUCCESS,
   *       }),
   *     ),
   *   ],
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/components/reference
   * @see https://docs.discord.com/developers/platform/components
   */
  namespace components {
    /**
     * Wrap child components in an action row (max 5 per message).
     *
     * @param components The components to place in this row.
     */
    function actionRow(...components: Component[]): ActionRowComponent;

    /**
     * Create a button component.
     *
     * @param options Button style, label, emoji, custom ID, etc.
     */
    function button(options: ButtonOptions): ButtonComponent;

    /**
     * Create a channel select menu.
     *
     * @param options The select menu configuration and channel type filters.
     */
    function channelSelect(options: ChannelSelectOptions): Component;

    /**
     * Create an individual checkbox component.
     *
     * @param options The checkbox configuration.
     */
    function checkbox(options: CheckboxOptions): Component;

    /**
     * Create a checkbox group for a modal.
     *
     * @param options The checkbox group configuration.
     */
    function checkboxGroup(options: CheckboxGroupOptions): Component;

    /**
     * Create a Components V2 container that groups child components.
     *
     * @param components The components to group.
     */
    function container(...components: Component[]): Component;

    /**
     * Create a Components V2 file display.
     *
     * @param options File URL and optional spoiler flag.
     */
    function file(options: { spoiler?: boolean; url: string }): Component;

    /**
     * Create a file upload component.
     *
     * @param options Custom ID, label, and required flag.
     */
    function fileUpload(options: {
      customId: string;
      label?: string;
      required?: boolean;
    }): Component;

    /**
     * Create a labelled modal field wrapper.
     *
     * @param label The label text.
     * @param component The wrapped component.
     * @param description Optional description.
     */
    function label(
      label: string,
      component: Component,
      description?: string,
    ): Component;

    /**
     * Create a link-style button that navigates to a URL.
     *
     * @param label Button text.
     * @param url The URL to open.
     * @param emoji Optional emoji to display.
     */
    function linkButton(
      label: string,
      url: string,
      emoji?: EmojiData,
    ): ButtonComponent;

    /**
     * Create a Components V2 media gallery.
     *
     * @param items Array of media items with URL and optional dimensions.
     */
    function mediaGallery(
      items: Array<{
        height?: number;
        url: string;
        width?: number;
      }>,
    ): Component;

    /**
     * Create a mentionable (user + role) select menu.
     *
     * @param options The select menu configuration.
     */
    function mentionableSelect(options: SelectOptions): Component;

    /**
     * Create a modal container with a title and components.
     *
     * @param options Modal custom ID, title, and child components.
     */
    function modal(options: {
      components: Component[];
      customId: string;
      title: string;
    }): ModalComponent;

    /**
     * Create a radio group component.
     *
     * @param options The radio group configuration.
     */
    function radioGroup(options: RadioGroupOptions): Component;

    /**
     * Create a role select menu.
     *
     * @param options The select menu configuration.
     */
    function roleSelect(options: SelectOptions): Component;

    /**
     * Create a Components V2 section with an optional accessory.
     *
     * @param options Section label, component, description, and accessory.
     */
    function section(options: {
      accessory?: Component;
      component: Component;
      description?: string;
      label: string;
    }): Component;

    /**
     * Create a select option object (for use in stringSelect).
     *
     * @param options The option label, value, description, etc.
     */
    function selectOption(options: SelectOption): SelectOption;

    /**
     * Create a Components V2 visual separator.
     *
     * @param options Optional spacing and divider settings.
     */
    function separator(options?: {
      divider?: boolean;
      spacing?: number;
    }): Component;

    /**
     * Create a string select dropdown menu.
     *
     * @param options The select menu and its options.
     */
    function stringSelect(options: StringSelectOptions): StringSelectComponent;

    /**
     * Create a Components V2 text display element.
     *
     * @param content The text content to display.
     */
    function textDisplay(content: string): TextDisplayComponent;

    /**
     * Create a modal text input component.
     *
     * @param options The text input configuration.
     */
    function textInput(options: TextInputOptions): TextInputComponent;

    /**
     * Create a Components V2 thumbnail image.
     *
     * @param options Image URL and optional dimensions.
     */
    function thumbnail(options: {
      height?: number;
      url: string;
      width?: number;
    }): Component;

    /**
     * Create a user select menu.
     *
     * @param options The select menu configuration.
     */
    function userSelect(options: SelectOptions): Component;
  }

  /**
   * Event name constants. Pass these as the first argument to `discord.on()` to subscribe to gateway events.
   * A deployment only receives events exposed by the bot's configured gateway intents.
   *
   * @see https://docs.discord.com/developers/events/gateway-events
   * @see https://docs.discord.com/developers/events/gateway#gateway-intents
   */
  namespace events {
    const CHANNEL_CREATE: "CHANNEL_CREATE";
    const CHANNEL_UPDATE: "CHANNEL_UPDATE";
    const CHANNEL_DELETE: "CHANNEL_DELETE";
    const CHANNEL_PINS_UPDATE: "CHANNEL_PINS_UPDATE";
    const THREAD_CREATE: "THREAD_CREATE";
    const THREAD_UPDATE: "THREAD_UPDATE";
    const THREAD_DELETE: "THREAD_DELETE";
    const THREAD_LIST_SYNC: "THREAD_LIST_SYNC";
    const THREAD_MEMBER_UPDATE: "THREAD_MEMBER_UPDATE";
    const THREAD_MEMBERS_UPDATE: "THREAD_MEMBERS_UPDATE";
    const GUILD_CREATE: "GUILD_CREATE";
    const GUILD_UPDATE: "GUILD_UPDATE";
    const GUILD_DELETE: "GUILD_DELETE";
    const GUILD_BAN_ADD: "GUILD_BAN_ADD";
    const GUILD_BAN_REMOVE: "GUILD_BAN_REMOVE";
    const GUILD_EMOJIS_UPDATE: "GUILD_EMOJIS_UPDATE";
    const GUILD_STICKERS_UPDATE: "GUILD_STICKERS_UPDATE";
    const GUILD_INTEGRATIONS_UPDATE: "GUILD_INTEGRATIONS_UPDATE";
    const GUILD_MEMBER_ADD: "GUILD_MEMBER_ADD";
    const GUILD_MEMBER_UPDATE: "GUILD_MEMBER_UPDATE";
    const GUILD_MEMBER_REMOVE: "GUILD_MEMBER_REMOVE";
    const GUILD_ROLE_CREATE: "GUILD_ROLE_CREATE";
    const GUILD_ROLE_UPDATE: "GUILD_ROLE_UPDATE";
    const GUILD_ROLE_DELETE: "GUILD_ROLE_DELETE";
    const GUILD_SCHEDULED_EVENT_CREATE: "GUILD_SCHEDULED_EVENT_CREATE";
    const GUILD_SCHEDULED_EVENT_UPDATE: "GUILD_SCHEDULED_EVENT_UPDATE";
    const GUILD_SCHEDULED_EVENT_DELETE: "GUILD_SCHEDULED_EVENT_DELETE";
    const GUILD_SCHEDULED_EVENT_USER_ADD: "GUILD_SCHEDULED_EVENT_USER_ADD";
    const GUILD_SCHEDULED_EVENT_USER_REMOVE: "GUILD_SCHEDULED_EVENT_USER_REMOVE";
    const GUILD_SOUNDBOARD_SOUND_CREATE: "GUILD_SOUNDBOARD_SOUND_CREATE";
    const GUILD_SOUNDBOARD_SOUND_UPDATE: "GUILD_SOUNDBOARD_SOUND_UPDATE";
    const GUILD_SOUNDBOARD_SOUND_DELETE: "GUILD_SOUNDBOARD_SOUND_DELETE";
    const GUILD_SOUNDBOARD_SOUNDS_UPDATE: "GUILD_SOUNDBOARD_SOUNDS_UPDATE";
    const INVITE_CREATE: "INVITE_CREATE";
    const INVITE_DELETE: "INVITE_DELETE";
    const MESSAGE_CREATE: "MESSAGE_CREATE";
    const MESSAGE_UPDATE: "MESSAGE_UPDATE";
    const MESSAGE_DELETE: "MESSAGE_DELETE";
    const MESSAGE_DELETE_BULK: "MESSAGE_DELETE_BULK";
    const MESSAGE_REACTION_ADD: "MESSAGE_REACTION_ADD";
    const MESSAGE_REACTION_REMOVE: "MESSAGE_REACTION_REMOVE";
    const MESSAGE_REACTION_REMOVE_ALL: "MESSAGE_REACTION_REMOVE_ALL";
    const MESSAGE_REACTION_REMOVE_EMOJI: "MESSAGE_REACTION_REMOVE_EMOJI";
    const INTERACTION_CREATE: "INTERACTION_CREATE";
    const PRESENCE_UPDATE: "PRESENCE_UPDATE";
    const TYPING_START: "TYPING_START";
    const USER_UPDATE: "USER_UPDATE";
    const VOICE_STATE_UPDATE: "VOICE_STATE_UPDATE";
    const VOICE_SERVER_UPDATE: "VOICE_SERVER_UPDATE";
    const VOICE_CHANNEL_STATUS_UPDATE: "VOICE_CHANNEL_STATUS_UPDATE";
    const VOICE_CHANNEL_START_TIME_UPDATE: "VOICE_CHANNEL_START_TIME_UPDATE";
    const WEBHOOKS_UPDATE: "WEBHOOKS_UPDATE";
    const AUTO_MODERATION_RULE_CREATE: "AUTO_MODERATION_RULE_CREATE";
    const AUTO_MODERATION_RULE_UPDATE: "AUTO_MODERATION_RULE_UPDATE";
    const AUTO_MODERATION_RULE_DELETE: "AUTO_MODERATION_RULE_DELETE";
    const AUTO_MODERATION_ACTION_EXECUTION: "AUTO_MODERATION_ACTION_EXECUTION";
    const AUDIT_LOG_ENTRY_CREATE: "AUDIT_LOG_ENTRY_CREATE";
    const GUILD_AUDIT_LOG_ENTRY_CREATE: "GUILD_AUDIT_LOG_ENTRY_CREATE";
  }

  /**
   * Payload for guild ban add/remove events.
   */
  interface GuildBanEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * The banned/unbanned user.
     */
    user: User;
  }

  /**
   * Payload for a guild member remove event.
   */
  interface GuildMemberRemoveEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * User who left or was removed from the guild.
     */
    user: User;
  }

  /**
   * Payload for guild role create/update events.
   */
  interface GuildRoleEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * Role created or updated by the event.
     */
    role: Role;
  }

  /**
   * Payload for a guild role delete event.
   */
  interface GuildRoleDeleteEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * ID of the role.
     */
    roleId: Snowflake;
  }

  /**
   * Payload containing only a guild ID.
   */
  interface GuildIdEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;
  }

  /**
   * Payload for a guild emoji update event.
   */
  interface GuildEmojisUpdateEvent {
    /**
     * The full list of emojis after the change.
     */
    emojis: Emoji[];

    /**
     * ID of the guild.
     */
    guildId: Snowflake;
  }

  /**
   * Payload for a guild sticker update event.
   */
  interface GuildStickersUpdateEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * The full list of stickers after the change.
     */
    stickers: Sticker[];
  }

  /**
   * Payload for scheduled event user add/remove events.
   */
  interface GuildScheduledEventUserEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * ID of the scheduled event.
     */
    guildScheduledEventId: Snowflake;

    /**
     * ID of the user.
     */
    userId: Snowflake;
  }

  /**
   * Payload for a single message delete event.
   */
  interface MessageDeleteEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * ID of the guild.
     */
    guildId: Snowflake | null;

    /**
     * Discord snowflake ID.
     */
    id: Snowflake;
  }

  /**
   * Payload for a bulk message delete event.
   */
  interface MessageDeleteBulkEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * ID of the guild.
     */
    guildId: Snowflake | null;

    /**
     * IDs of the deleted messages.
     */
    ids: Snowflake[];
  }

  /**
   * Payload for a message reaction add/remove event.
   */
  interface MessageReactionEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * The emoji used in the reaction.
     */
    emoji: {
      animated: boolean;
      id: Snowflake | null;
      name: string | null;
    };

    /**
     * ID of the guild.
     */
    guildId: Snowflake | null;

    /**
     * The guild member who reacted, or `null` when Discord omits it.
     */
    member: GuildMember | null;

    /**
     * ID of the referenced message.
     */
    messageId: Snowflake;

    /**
     * ID of the user.
     */
    userId: Snowflake;
  }

  /**
   * Payload for clearing all reactions from a message.
   */
  interface MessageReactionRemoveAllEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * ID of the guild.
     */
    guildId: Snowflake | null;

    /**
     * ID of the referenced message.
     */
    messageId: Snowflake;
  }

  /**
   * Payload for clearing one emoji reaction from a message.
   */
  interface MessageReactionRemoveEmojiEvent extends MessageReactionRemoveAllEvent {
    /**
     * The emoji whose reactions were removed.
     */
    emoji: {
      animated: boolean;
      id: Snowflake | null;
      name: string | null;
    };
  }

  /**
   * Payload for a channel pins update event.
   */
  interface ChannelPinsUpdateEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * ID of the guild.
     */
    guildId: Snowflake | null;

    /**
     * When the newest pin was created, or `null` if no pins remain.
     */
    lastPinTimestamp: Date | null;
  }

  /**
   * Payload for thread list sync events.
   */
  interface ThreadListSyncEvent {
    /**
     * Parent channel IDs whose threads were synced (empty = all).
     */
    channelIds: Snowflake[];

    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * Thread members the bot is added to.
     */
    members: Array<{
      id: Snowflake;
      joinedAt: Date | null;
      userId: Snowflake;
    }>;

    /**
     * All active thread channels.
     */
    threads: ThreadChannel[];
  }

  /**
   * Payload for a thread member update event.
   */
  interface ThreadMemberUpdateEvent {
    /**
     * Thread member flags.
     */
    flags: number;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * Discord snowflake ID.
     */
    id: Snowflake;

    /**
     * When the member joined the thread.
     */
    joinedAt: Date | null;

    /**
     * ID of the user.
     */
    userId: Snowflake;
  }

  /**
   * Payload for a batch thread members update event.
   */
  interface ThreadMembersUpdateEvent {
    /**
     * Members who were added in this update.
     */
    addedMembers: Array<{
      joinedAt: Date | null;
      userId: Snowflake;
    }>;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * Discord snowflake ID.
     */
    id: Snowflake;

    /**
     * Current number of thread members.
     */
    memberCount: number;

    /**
     * User IDs of members who were removed.
     */
    removedMemberIds: Snowflake[];
  }

  /**
   * Payload for an invite delete event.
   */
  interface InviteDeleteEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * Invite code.
     */
    code: string;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;
  }

  /**
   * Payload for a typing start event.
   */
  interface TypingStartEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * ID of the guild.
     */
    guildId: Snowflake | null;

    /**
     * The guild member typing, or `null` when Discord omits it.
     */
    member: GuildMember | null;

    /**
     * When the typing started.
     */
    timestamp: Date;

    /**
     * ID of the user.
     */
    userId: Snowflake;
  }

  /**
   * Payload for a voice server update event.
   */
  interface VoiceServerUpdateEvent {
    /**
     * The new voice server endpoint.
     */
    endpoint: string;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * The new voice connection token.
     */
    token: string;
  }

  interface VoiceChannelStatusUpdateEvent {
    id: Snowflake;
    guildId: Snowflake;
    status: string | null;
  }

  interface VoiceChannelStartTimeUpdateEvent {
    id: Snowflake;
    guildId: Snowflake;
    voiceStartTime: Date | null;
  }

  /**
   * Payload for a webhooks update event.
   */
  interface WebhooksUpdateEvent {
    /**
     * ID of the channel.
     */
    channelId: Snowflake;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;
  }

  /**
   * Payload for a presence update event.
   */
  type PresenceUpdateEvent = Presence;

  /**
   * Payload for auto moderation rule create/update events.
   */
  interface AutoModRuleEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * The auto moderation rule.
     */
    rule: AutoModRule;
  }

  /**
   * Payload for an auto moderation rule delete event.
   */
  interface AutoModRuleDeleteEvent {
    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * The ID of the deleted rule.
     */
    ruleId: Snowflake;
  }

  /**
   * Payload for an auto moderation action execution event.
   */
  interface AutoModActionExecutionEvent {
    /**
     * The action that was taken.
     */
    action: AutoModAction;

    /**
     * The alert message ID sent to the alert channel, or `null`.
     */
    alertSystemMessage: Snowflake | null;

    /**
     * ID of the channel.
     */
    channelId: Snowflake | null;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;

    /**
     * The content that matched the rule, or `null`.
     */
    matchedContent: string | null;

    /**
     * The specific keyword or regex that matched, or `null`.
     */
    matchedKeyword: string | null;

    /**
     * ID of the referenced message.
     */
    messageId: Snowflake | null;

    /**
     * The rule that triggered.
     */
    ruleId: Snowflake;

    /**
     * ID of the user.
     */
    userId: Snowflake;
  }

  /**
   * Payload for audit log entry create events.
   */
  interface AuditLogEntryEvent {
    /**
     * The audit log entry.
     */
    entry: AuditLogEntry;

    /**
     * ID of the guild.
     */
    guildId: Snowflake;
  }

  /**
   * Subscribe to a Discord gateway event.
   * Each overload pairs an event name constant from `events` with the corresponding handler signature.
   * The handler receives typed payloads matching the event (the payload object, or a primary object
   * with an optional `old` parameter for update events).
   *
   * Register handlers at module scope. Weeble loads them when a deployment warms and
   * awaits the returned promise for each dispatched event.
   *
   * #### Example
   * ```ts
   * discord.on(discord.events.GUILD_MEMBER_ADD, async (member) => {
   *   const channel = await discord.fetchGuildTextChannel('1504537312841961583');
   *   if (channel) await channel.send(`Welcome ${member.toMention()}`);
   * });
   * ```
   *
   * @param event One of the `events.*` constants identifying the gateway event.
   * @param handler Async callback invoked when the event fires. Signature varies by event.
   * @see https://docs.discord.com/developers/events/gateway-events
   */
  function on(
    event: typeof events.CHANNEL_CREATE,
    handler: (channel: AnyGuildChannel) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.CHANNEL_UPDATE,
    handler: (
      channel: AnyGuildChannel,
      old: AnyGuildChannel | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.CHANNEL_DELETE,
    handler: (channel: AnyGuildChannel) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.CHANNEL_PINS_UPDATE,
    handler: (event: ChannelPinsUpdateEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.THREAD_CREATE,
    handler: (thread: ThreadChannel) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.THREAD_UPDATE,
    handler: (
      thread: ThreadChannel,
      old: ThreadChannel | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.THREAD_DELETE,
    handler: (thread: ThreadChannel) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.THREAD_LIST_SYNC,
    handler: (event: ThreadListSyncEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.THREAD_MEMBER_UPDATE,
    handler: (event: ThreadMemberUpdateEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.THREAD_MEMBERS_UPDATE,
    handler: (event: ThreadMembersUpdateEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_CREATE,
    handler: (guild: Guild) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_UPDATE,
    handler: (guild: Guild, old: Guild | null) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_DELETE,
    handler: (guild: Guild) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_BAN_ADD,
    handler: (event: GuildBanEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_BAN_REMOVE,
    handler: (event: GuildBanEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_EMOJIS_UPDATE,
    handler: (
      event: GuildEmojisUpdateEvent,
      old: GuildEmojisUpdateEvent | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_STICKERS_UPDATE,
    handler: (
      event: GuildStickersUpdateEvent,
      old: GuildStickersUpdateEvent | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_INTEGRATIONS_UPDATE,
    handler: (event: GuildIdEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_MEMBER_ADD,
    handler: (member: GuildMember) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_MEMBER_UPDATE,
    handler: (member: GuildMember, old: GuildMember | null) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_MEMBER_REMOVE,
    handler: (
      event: GuildMemberRemoveEvent,
      member: GuildMember | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_ROLE_CREATE,
    handler: (event: GuildRoleEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_ROLE_UPDATE,
    handler: (event: GuildRoleEvent, old: Role | null) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_ROLE_DELETE,
    handler: (
      event: GuildRoleDeleteEvent,
      old: Role | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_CREATE,
    handler: (event: ScheduledEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_UPDATE,
    handler: (
      event: ScheduledEvent,
      old: ScheduledEvent | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_DELETE,
    handler: (event: ScheduledEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_USER_ADD,
    handler: (event: GuildScheduledEventUserEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_USER_REMOVE,
    handler: (event: GuildScheduledEventUserEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUND_CREATE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUND_UPDATE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUND_DELETE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUNDS_UPDATE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.INVITE_CREATE,
    handler: (invite: Invite) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.INVITE_DELETE,
    handler: (event: InviteDeleteEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_CREATE,
    handler: (message: Message | GuildMemberMessage) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_UPDATE,
    handler: (
      message: Message | GuildMemberMessage,
      old: Message | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_DELETE,
    handler: (
      event: MessageDeleteEvent,
      old: Message | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_DELETE_BULK,
    handler: (event: MessageDeleteBulkEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_REACTION_ADD,
    handler: (event: MessageReactionEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_REACTION_REMOVE,
    handler: (event: MessageReactionEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_REACTION_REMOVE_ALL,
    handler: (event: MessageReactionRemoveAllEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.MESSAGE_REACTION_REMOVE_EMOJI,
    handler: (event: MessageReactionRemoveEmojiEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.INTERACTION_CREATE,
    handler: (interaction: Interaction) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.PRESENCE_UPDATE,
    handler: (event: PresenceUpdateEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.TYPING_START,
    handler: (event: TypingStartEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.USER_UPDATE,
    handler: (event: User) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.VOICE_STATE_UPDATE,
    handler: (event: VoiceState, old: VoiceState | null) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.VOICE_SERVER_UPDATE,
    handler: (event: VoiceServerUpdateEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.VOICE_CHANNEL_STATUS_UPDATE,
    handler: (event: VoiceChannelStatusUpdateEvent) => void | Promise<unknown>,
  ): void;
  function on(
    event: typeof events.VOICE_CHANNEL_START_TIME_UPDATE,
    handler: (
      event: VoiceChannelStartTimeUpdateEvent,
    ) => void | Promise<unknown>,
  ): void;
  function on(
    event: typeof events.WEBHOOKS_UPDATE,
    handler: (event: WebhooksUpdateEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.AUTO_MODERATION_RULE_CREATE,
    handler: (event: AutoModRuleEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.AUTO_MODERATION_RULE_UPDATE,
    handler: (
      event: AutoModRuleEvent,
      old: AutoModRuleEvent | null,
    ) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.AUTO_MODERATION_RULE_DELETE,
    handler: (event: AutoModRuleDeleteEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.AUTO_MODERATION_ACTION_EXECUTION,
    handler: (event: AutoModActionExecutionEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.AUDIT_LOG_ENTRY_CREATE,
    handler: (event: AuditLogEntryEvent) => Promise<unknown>,
  ): void;
  function on(
    event: typeof events.GUILD_AUDIT_LOG_ENTRY_CREATE,
    handler: (event: AuditLogEntryEvent) => Promise<unknown>,
  ): void;
  function on(
    event: string,
    handler: (payload: unknown) => void | Promise<void>,
  ): void;

  /**
   * Returns the ID of the bot running this deployment.
   * This value is available while a deployed script is running.
   */
  function getBotId(): Snowflake;

  /**
   * Returns the guild ID assigned to this deployment.
   * This is the guild selected for the deployment, not a guild inferred from the
   * currently handled event.
   */
  function getGuildId(): Snowflake;

  /**
   * Fetches the bot user running this deployment.
   */
  function fetchBotUser(): Promise<User>;

  /**
   * Fetches a user from Discord by ID.
   * Returns `null` when Discord reports that the user does not exist.
   *
   * #### Example
   *
   * ```ts
   * const user = await discord.fetchUser('123456789012345678');
   * if (user) console.log(user.displayName);
   * ```
   *
   * @param userId The user ID to fetch.
   * @see https://docs.discord.com/developers/resources/user#get-user
   */
  function fetchUser(userId: Snowflake): Promise<User | null>;

  /**
   * Fetches the guild assigned to this deployment.
   * Returns `null` when Discord reports that the guild does not exist.
   */
  function fetchGuild(): Promise<Guild | null>;

  /**
   * Fetches a guild from Discord by ID.
   * The bot must have access to the guild. Returns `null` when Discord reports it missing.
   *
   * @param guildId The guild ID to fetch.
   */
  function fetchGuild(guildId: Snowflake): Promise<Guild | null>;

  /**
   * Fetches any channel from Discord by ID.
   * Use a typed channel getter when you intend to call channel-specific methods.
   * Returns `null` when the channel cannot be found or fetched.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchChannel(channelId: Snowflake): Promise<AnyChannel | null>;

  /**
   * Fetches a channel that can receive messages.
   * Returns `null` for voice, category, forum, stage, or missing channels.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchTextChannel(channelId: Snowflake): Promise<TextChannel | null>;

  /**
   * Fetches a guild text or announcement channel.
   * Returns `null` when the channel has another type or does not exist.
   *
   * #### Example
   *
   * ```ts
   * const channel = await discord.fetchGuildTextChannel(config.logsChannel);
   * if (!channel) return console.warn('Invalid logs channel.');
   * await channel.send('Ready.');
   * ```
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildTextChannel(
    channelId: Snowflake,
  ): Promise<GuildTextChannel | null>;

  /**
   * Fetches any channel that belongs to a guild.
   * Returns `null` for unsupported or missing channels.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildChannel(
    channelId: Snowflake,
  ): Promise<AnyGuildChannel | null>;

  /**
   * Fetches an announcement channel, or `null` when the channel has another type or does not exist.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildAnnouncementChannel(
    channelId: Snowflake,
  ): Promise<GuildAnnouncementChannel | null>;

  /**
   * Fetches a guild voice channel, or `null` when the channel has another type or does not exist.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildVoiceChannel(
    channelId: Snowflake,
  ): Promise<GuildVoiceChannel | null>;

  /**
   * Fetches a guild category, or `null` when the channel has another type or does not exist.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildCategory(
    channelId: Snowflake,
  ): Promise<GuildCategory | null>;

  /**
   * Fetches a guild forum channel, or `null` when the channel has another type or does not exist.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildForumChannel(
    channelId: Snowflake,
  ): Promise<GuildForumChannel | null>;

  /**
   * Fetches a guild stage channel, or `null` when the channel has another type or does not exist.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchGuildStageVoiceChannel(
    channelId: Snowflake,
  ): Promise<GuildStageVoiceChannel | null>;

  /**
   * Fetches a thread channel, or `null` when the channel has another type or does not exist.
   *
   * @param channelId The channel ID to fetch.
   */
  function fetchThreadChannel(
    channelId: Snowflake,
  ): Promise<ThreadChannel | null>;

  /**
   * Fetches an invite by its code.
   * Pass only the code portion of an invite URL. For `https://discord.gg/hTKzmak`,
   * the code is `"hTKzmak"`. Returns `null` when the invite is invalid or expired.
   *
   * @param code The part after `discord.gg/`.
   * @param options Options controlling which approximate counts and expiration fields Discord includes.
   */
  function fetchInvite(
    code: string,
    options?: {
      guildScheduledEventId?: Snowflake;
      withCounts?: boolean;
      withExpiration?: boolean;
    },
  ): Promise<Invite | null>;

  /**
   * Fetches a webhook by ID.
   * A webhook token may be required for webhooks the bot cannot access normally.
   * Returns `null` when Discord reports that the webhook does not exist.
   *
   * @param webhookId The webhook ID to fetch.
   * @param token The webhook token, when required.
   */
  function fetchWebhook(
    webhookId: Snowflake,
    token?: string,
  ): Promise<Webhook | null>;

  /**
   * Returns whether a channel can receive ordinary messages and narrows its type.
   */
  function isTextChannel(channel: Channel): channel is TextChannel;

  /**
   * Returns whether a channel is a guild text or announcement channel and narrows its type.
   */
  function isGuildTextChannel(channel: Channel): channel is GuildTextChannel;

  /**
   * Returns whether a channel belongs to a guild and narrows its type.
   */
  function isGuildChannel(channel: Channel): channel is AnyGuildChannel;

  /**
   * Returns whether a channel is an announcement channel and narrows its type.
   */
  function isGuildAnnouncementChannel(
    channel: Channel,
  ): channel is GuildAnnouncementChannel;

  /**
   * Returns whether a channel is a guild voice channel and narrows its type.
   */
  function isGuildVoiceChannel(channel: Channel): channel is GuildVoiceChannel;

  /**
   * Returns whether a channel is a guild category and narrows its type.
   */
  function isGuildCategory(channel: Channel): channel is GuildCategory;

  /**
   * Returns whether a channel is a guild forum channel and narrows its type.
   */
  function isGuildForumChannel(channel: Channel): channel is GuildForumChannel;

  /**
   * Returns whether a channel is a guild stage channel and narrows its type.
   */
  function isGuildStageVoiceChannel(
    channel: Channel,
  ): channel is GuildStageVoiceChannel;

  /**
   * Returns whether a channel is a thread and narrows its type.
   */
  function isThreadChannel(channel: Channel): channel is ThreadChannel;
}
