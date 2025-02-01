from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

class PromptGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    def generate_prompt(self, message):
        prompt = self.client.chat.completions.create(
            messages = [
                {
                    "role": "system",
                    "content": message
                }
            ],
            model = "gpt-4o"
        )

        return prompt.choices[0].message.content
