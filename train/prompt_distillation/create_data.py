import asyncio
import json
import os
import re
from typing import Any

import chz
import tinker
from tqdm.asyncio import tqdm_asyncio

from tinker_cookbook import renderers
from tinker_cookbook.tokenizer_utils import get_tokenizer

from train.prompt import QUERY_GENERATION_PROMPT


@chz.chz
class Config:
    output_file: str


def setup_clients():
    # disable tokenizer parallelism warnings
    import os

    os.environ["TOKENIZERS_PARALLELISM"] = "false"

    model_name = "Qwen/Qwen3-32B"
    sampling_path = "tinker://76f31240-d4d7-509d-afef-918b30838cc9:train:0/sampler_weights/final"

    print("Creating service client")
    service_client = tinker.ServiceClient()
    print("Creating sampling client")

    sampling_client = service_client.create_sampling_client(
        model_path=sampling_path,
    )
    tokenizer = get_tokenizer(model_name)
    renderer = renderers.get_renderer("qwen3", tokenizer)

    return sampling_client, tokenizer, renderer


async def create_data_async(cfg: Config, sampling_client: Any, tokenizer: Any, renderer: Any):

    async def sample_from_model(

    ) -> tuple[str, str | None]:
        prompt = QUERY_GENERATION_PROMPT
        tokenized_prompt = tinker.ModelInput.from_ints(tokenizer.encode(prompt))
        params = tinker.SamplingParams(
            max_tokens=1000, temperature=0.15, stop=renderer.get_stop_sequences()
        )
        result = await sampling_client.sample_async(
            prompt=tokenized_prompt, sampling_params=params, num_samples=1
        )
        response = tokenizer.decode(result.sequences[0].tokens)
        # parse the final answer from the response using regex for example: Final Answer: xx where xx is two character label for each language and nothing else. xx is one of the following: en, fr, es, hi, ja, ko, ru, ot.
        # the final answer is the xx part
        user_query = re.search(r"User Query: (\w+)", response)
        assistant_response = re.search(r"Assistant Response: (\w+)", response)
        final_user_query = user_query.group(1) if user_query else None
        final_assistant_response = assistant_response.group(1) if assistant_response else None
        return (final_user_query, final_assistant_response)

    answers: list[str | None] = []
    questions: list[str] = []
    query_number = 1300
    for coro in tqdm_asyncio.as_completed(
        [sample_from_model() for _ in range(query_number)], total=query_number
    ):
        question, answer = await coro
        answers.append(answer)
        questions.append(question)

    # save the input and final answer to a file
    with open(cfg.output_file, "w") as f:
        for question, answer in zip(questions, answers):
            if answer is None:
                continue
            messages = {
                "messages": [
                    {
                        "role": "user",
                        "content": question,
                    },
                    {
                        "role": "assistant",
                        "content": answer,
                    },
                ],
            }
            f.write(json.dumps(messages) + "\n")

    return


def main(cfg: Config):
    # check if the output file exists
    if os.path.exists(cfg.output_file):
        print(f"Output file {cfg.output_file} already exists")
        return
    elif not os.path.exists(os.path.dirname(cfg.output_file)):
        # check if the output directory exists
        print(f"Output directory {os.path.dirname(cfg.output_file)} does not exist")
        print(f"Creating directory {os.path.dirname(cfg.output_file)}")
        os.makedirs(os.path.dirname(cfg.output_file), exist_ok=True)

    # Setup clients synchronously
    sampling_client, tokenizer, renderer = setup_clients()

    print("Sampling data")
    # Run async data creation
    asyncio.run(create_data_async(cfg, sampling_client, tokenizer, renderer))
    print(f"Saved data to {cfg.output_file}")


if __name__ == "__main__":
    chz.nested_entrypoint(main)
