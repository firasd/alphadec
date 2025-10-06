# Against the UUID

A UUID is a 128-bit unique number, usually represented as a string of characters like f81d4fae-7dec-11d0-a765-00a0c91e6bf6
    
Consider: what is the point of all this paranoid entropy? Is there any chance that a 7-Eleven receipt and NASA spectrograph will end up in the same S3 bucket?

And even if so:
- How would you tell your objects apart? You'd still need a separate index to organize your jumble of UUIDs.
- Why would Snowflake IDs not suffice? Very few organizations are generating more varied objects at higher velocity than Twitter.

To be fair, if you were a software component identifying yourself to Windows 3.1 in 1992, a 'GUID' made sense. But UUIDs were never meant to be database keys (where they cause index problems) or URLs (where they're ugly).

And this is before we get to AI, which adds further wrinkles. Anthropic says in their [tool design guide](https://www.anthropic.com/engineering/writing-tools-for-agents): "We’ve found that merely resolving arbitrary alphanumeric UUIDs to more semantically meaningful and interpretable language (or even a 0-indexed ID scheme) significantly improves Claude’s precision in retrieval tasks by reducing hallucinations."

Now here is a cosmic truth: the arrow of Time is entropy by definition. Unless you specifically need entropy in a cryptographic sense, why ignore literal cosmic entropy to create a bag of your own?

Alphadec, like Snowflake, KSUIDs, and ULIDs, embraces time as built-in disambiguation.

However, an Alphadec prefix like 2025_P5U5_326662 is more easily interpretable than the others.

Learn more: [AlphaDec README](https://github.com/firasd/alphadec)
