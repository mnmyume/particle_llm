import asyncio

import tinker
from tinker import types
from tinker_cookbook import model_info
from tinker_cookbook import renderers
from tinker_cookbook.eval.evaluators import SamplingClientEvaluator
from tinker_cookbook.tokenizer_utils import get_tokenizer

from train.prompt import SYSTEM_PROMPT

system_prompt = SYSTEM_PROMPT


class Responser(SamplingClientEvaluator):
    """
    Get model response without evaluation.
    """

    def __init__(
            self,
            message,
            model_name: str,
            renderer_name: str,
    ):
        self.message = message

        tokenizer = get_tokenizer(model_name)
        self.renderer = renderers.get_renderer(name=renderer_name, tokenizer=tokenizer)

    async def __call__(self, sampling_client: tinker.SamplingClient):

        sampling_params = types.SamplingParams(
            max_tokens=4000,
            temperature=0.7,
            top_p=1.0,
            stop=self.renderer.get_stop_sequences(),
        )

        model_input: types.ModelInput = self.renderer.build_generation_prompt(
            [
                renderers.Message(role="system", content=system_prompt),
                renderers.Message(role="user", content=self.message)
            ]
        )
        # Generate response
        r: types.SampleResponse = await sampling_client.sample_async(
            prompt=model_input, num_samples=1, sampling_params=sampling_params
        )
        tokens: list[int] = r.sequences[0].tokens
        response: renderers.Message = self.renderer.parse_response(tokens)[0]

        return response


model_name = "Qwen/Qwen3-8B"
renderer_name = model_info.get_recommended_renderer_name(model_name)

# message
responser = Responser(
    message="Show me an autumn effect with falling leaves.",
    renderer_name=renderer_name,
    model_name=model_name,
)


service_client = tinker.ServiceClient()

sampling_path = "tinker://e57c56c3-14ef-5454-a2c9-34e692e55e8e:train:0/sampler_weights/final"

sampling_client = service_client.create_sampling_client(
    model_path=sampling_path
)

async def main():
    result = await responser(sampling_client)
    print(result)

asyncio.run(main())