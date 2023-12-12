# Create a project

Projects in Fonoster allow you to manage related resources in a single place. With your Project account, you can create and manage your Providers, Numbers, SIP Agents, Domains, Functions, and many more features.

Follow the next few steps to create a new Project using the CLI.

First, open a new terminal.

Next, login using the Account `AccessKeyId` and `AccessKeySecret` from the [Console](https://console.fonoster.com) 

```none
fonoster auth:login
```

Then, create a new Project with:

```none
fonoster projects:create
```

Type a friendly name and chose to enable or disable experimental APIs.

:::note

Each Project has its own `AccessKeyId` and `AccessKeySecret`, and the `PJ` prefix (e.g: `PJ619154d081467a0700000001`), and that is the result you'll see in your terminal. 

:::note

## Select a project

To start working on a Project, you first must select it as default. To do so, follow these few steps:

First, open a new terminal.

Next, find the Project's reference with:

```
fonoster projects:list
```

Finally, set it as default with the `projects:use` command. For example:

```none
# Be sure to replace with your Project's AccessKeyId
fonoster projects:use PJ619154d081467a0700000001
```

You are all set. You can now begin adding your Providers, Numbers, and more.
