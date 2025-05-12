export const buildMessagesSearchQuery = ({
  search,
  websiteId,
  conversationId,
}: {
  search: string;
  websiteId: string;
  conversationId: string;
}) => ({
  bool: {
    must: [
      { term: { websiteId } },
      { term: { conversationId } },
      {
        match: {
          content: {
            query: search,
            fuzziness: 'AUTO',
          },
        },
      },
    ],
  },
});
