from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

prompt = client.chat.completions.create(
    messages = [
        {
            "role": "system",
            "content": "Create a starting prompt for a version of madlibs where the blanks are the last few words of the sentence. Just a single sentence."
        }
    ],
    model = "gpt-4o"
)

# Example usage:
print(prompt.choices[0].message.content)