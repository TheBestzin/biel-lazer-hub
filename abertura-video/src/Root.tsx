import { Composition } from "remotion";
import { AberturaBiel } from "./AberturaBiel";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="AberturaBiel"
				component={AberturaBiel}
				durationInFrames={240}
				fps={30}
				width={1080}
				height={1080}
			/>
		</>
	);
};
