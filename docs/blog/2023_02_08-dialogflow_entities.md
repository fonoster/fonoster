---
slug: Dialogflow entities 
title: Dialogflow entities. Capturing useful data.
authors: [yuricodes]
tags: [fonoster, voice, OSS, VUI, Dialogflow]
---

# Dialogflow entities 

Dialogflow sits in the middle between the user and our application, helping us capture conversations from natural language into useful and readable data. 

**Entities** take care of extracting information and details from what the user says. They are present the moment you create your first intent and start
creating training phrases, Dialogflow will automatically identify and label some words suggesting entities for you to match with an intent.

Having entities set in place will help you train your assistant and make it more efficient for the users. These can be created manually or by a JSON or CSV file.

There are multiple types of entities:

- **System entities:**

These are default entities of Dialogflow and they match many types of common words like geographic locations or dates.
 
```
@sys.date
```

- **Custom or developer entities:**

These allow you to define your own words to trigger an intent, you can also provide synonyms. 

They come in handy when building your own assistant with specific words you want it to listen to and identify so you can provide 
an accurate response to your users. 

Just remember that when providing a custom name, it can start with a letter, number, dash or underscore. 

```
@computer_service
```

  - **Custom or developer composite entities:**
   These are built from multiple custom entities linked to be triggered together. 
   
   ```
   @os_computer[@os_device @computer_service]
   ```
- **Session entities:**

They are generated for a single user-specific session, from one conversation between the agent and the user.

These entities expire automatically after 20 minutes. 

- **Regexp entities:**

These utilize Regular Expressions to match more specialized entities from the user.

It is important to remember that the order in which you present your regular expressions to the agent matter because the search will stop once a valid match is found.

## Entity vs Intent 

**Entities** will make your development time quicker and, once identified by the agent, provide accurate responses to the interaction at hand. They are the way you have to catch important data from the user. **Intent** helps understand what the user request really means, it usually contains training phrases that help it identify what the end-user expression wants, actions to be performed after an intent is identified, parameters that will form the entity and dictate how data is extracted and responses that will be returned to the end-user.


### Join the conversation 

Fonoster is developed in the open. Here are some of the channels you can use to reach us: 

[Discord](https://discord.gg/4QWgSz4hTC)

**GitHub discussions:**
- [Q&A](https://github.com/fonoster/fonoster/discussions/categories/q-a) 

**Twitter:** [@fonoster](https://twitter.com/fonoster)


