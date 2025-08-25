export default ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-azure-storage",
      providerOptions: {
        authType: "default",
        account: env("AZURE_STORAGE_ACCOUNT_NAME"),
        accountKey: env("AZURE_STORAGE_ACCOUNT_KEY"),
        serviceBaseURL: env("AZURE_STORAGE_URL"),
        containerName: env("AZURE_STORAGE_CONTAINER_NAME", "public"),
        defaultPath: env("AZURE_STORAGE_DEFAULT_PATH", "uploads"),
        maxConcurrent: 10,
      },
    },
  },
});
