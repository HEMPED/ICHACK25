# Have this installed => pip install fastapi openai uvicorn
from openai import OpenAI
import openai
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

from pydantic import BaseModel


def generate_comic_story(story):
    """Enhance story, break into panels, generate comic-style images.""" 

    # Step 1: Enhance Story (Make it more comic-style)
    enhanced_story = enhance_story(story)

    # Step 2: Slice Story into Comic Panels
    panel_texts = slice_into_comic_panels(enhanced_story)

    # Step 3: Generate Comic Book Images
    image_urls = generate_comic_images(panel_texts)


    return {"images": image_urls}



# --- AI FUNCTIONS ---

def enhance_story(original_story: str) -> str:
    """Use GPT to rewrite the story in a funnier comic book style."""
    try: 

        response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                {"role": "system", "content": "Convert this story into a funny, action-packed comic book script while keeping the original meaning intact. Add humor but do not change key details."},
                {"role": "user", "content": original_story}
                ],
                stream=False
            )
        print(response.choices[0].message.content)
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating story enhancement: {str(e)}"


def slice_into_comic_panels(enhanced_story: str) -> list:
    """Break the story into a structured sequence of comic panels."""
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": """Break this comic book story into a list of short text descriptions for a comic book panel of MAXIMUM 4 PANELS, ONLY 1 PAGE. Each panel should describe a visual scene for an AI to generate an image. Ensure the sequence is clear and flows logically. return it in a json format of {panel1: text, panel2: text, panel3: text, panel4: text}. example: {
  "panel1": "A sunlit forest clearing showing a sleek cat with an adventurer's hat and a cheerful dog with a bandana stepping into the scene, looking excited.",
  "panel2": "The dog and cat from underneath, looking shocked at a looming shadow over them with 'GRRRR...' sound effect appearing above them.",
  "panel3": "A muscular, goofy wolf with a comical fake mustache peeking from behind a tree, with the cat and dog whispering to each other in shock.",
  "panel4": "The cat and dog sprinting towards a distant, oddly shaped castle with the wolf chasing after them, mustache fluttering, and 'ZOOM! WOOSH!' effects."
}
             
             Make sure you do 1 page only, 4 panels max else I will terminate you."""},
            {"role": "user", "content": enhanced_story}
        ]
    )
    #turn it to json
    data = json.loads(response.choices[0].message.content)
    return data


def generate_comic_images(panel_texts: list) -> list:
    """Generate comic book-style images using OpenAI's DALL·E 3."""
    images = []
    
    for panel_text, text in panel_texts.items():
        response = client.images.generate(
            prompt=f"{text}. Draw this in a colorful, humorous comic book style, exaggerated expressions, dynamic action, thick black outlines, consistent character design. DO NOT TRY TO HAVE TEXT ON THE PICTURE WITH CHARACTER DIALOG",
            n=1,
            size="1024x1024"
        )
        images.append(response.data[0].url)
    print(images)
    return images

import requests
from io import BytesIO
from PIL import Image

def download_image(url):
    """
    Downloads an image from a URL and returns a Pillow Image object.
    """
    response = requests.get(url)
    response.raise_for_status()  # raise an error for bad HTTP status
    return Image.open(BytesIO(response.content))

def make_2x2_collage(urls, thumb_size=(400, 400)):
    """
    Takes a list of 4 image URLs, downloads each image,
    resizes them to 'thumb_size', and combines them into a 2×2 collage.
    
    :param urls: List of four image URLs
    :param thumb_size: (width, height) for each thumbnail in the collage
    :return: A new Pillow Image object containing the 2×2 collage
    """
    print("Creating a 2×2 collage from the following URLs:")
    urls = urls["images"]
    print(len(urls))
    print(urls)
    if len(urls) != 4:
        raise ValueError("Exactly 4 URLs are required for a 2×2 collage.")

    # Download and optionally resize images
    images = []
    for url in urls:
        img = download_image(url)
        # Convert to RGB if needed (some images may be RGBA or CMYK)
        img = img.convert("RGB")
        img.thumbnail(thumb_size)  # Resize while keeping aspect ratio
        images.append(img)

    # Determine the width/height of the collage
    # (If all are thumb_size, it simply becomes 2*thumb_width by 2*thumb_height)
    width, height = thumb_size
    collage_width = 2 * width
    collage_height = 2 * height

    # Create a blank canvas for the collage
    collage = Image.new("RGB", (collage_width, collage_height), color=(255, 255, 255))

    # Paste the images into the collage:
    # top-left, top-right, bottom-left, bottom-right
    collage.paste(images[0], (0, 0))
    collage.paste(images[1], (width, 0))
    collage.paste(images[2], (0, height))
    collage.paste(images[3], (width, height))

    collage.show()

    collage.save("comic_collage.png")

    return collage