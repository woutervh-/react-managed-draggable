import * as React from 'react';

export interface XY {
    x: number;
    y: number;
}

interface Cancelable {
    cancel: () => void;
}

const rafThrottle = <T extends (...args: any[]) => any>(callback: T) => {
    let requestId: number | null;

    const later = (context: any, args: any[]) => () => {
        requestId = null;
        callback.apply(context, args);
    };

    const throttled: any = function (this: any, ...args: any[]) {
        if ((requestId === null) || (requestId === undefined)) {
            requestId = window.requestAnimationFrame(later(this, args));
        }
    };

    throttled.cancel = () => requestId !== null && window.cancelAnimationFrame(requestId);

    return throttled as T & Cancelable;
};

function manhattanDistance(p1: XY, p2: XY): number {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

function getPosition(event: MouseEvent | TouchEvent): XY {
    if ('touches' in event) {
        if (event.touches.length >= 1) {
            return { x: event.touches[0].pageX, y: event.touches[0].pageY };
        } else {
            return { x: 0, y: 0 };
        }
    } else {
        return { x: event.pageX, y: event.pageY };
    }
}

export interface DragInformation {
    current: XY;
    start: XY;
    last: XY;
}

export interface DraggableProps {
    threshold?: number;
    onDragStart?: (event: MouseEvent | TouchEvent, dragPayload: DragInformation) => void;
    onDragMove?: (event: MouseEvent | TouchEvent, dragPayload: DragInformation) => void;
    onDragEnd?: (event: MouseEvent | TouchEvent | undefined, dragPayload: DragInformation) => void;
}

export class Draggable extends React.Component<DraggableProps, never> {
    private element: HTMLDivElement | null = null;

    private down: boolean = false;

    private dragging: boolean = false;

    private start: XY = { x: 0, y: 0 };

    private current: XY = { x: 0, y: 0 };

    private handleMove = rafThrottle((event: MouseEvent | TouchEvent) => {
        if (this.down) {
            const last = this.current;
            this.current = getPosition(event);
            if (this.dragging) {
                if (this.props.onDragMove) {
                    this.props.onDragMove(event, this.generateDragInformation(last));
                }
            } else {
                if (manhattanDistance(this.start, this.current) >= this.getThreshold()) {
                    this.dragging = true;
                    if (this.props.onDragStart) {
                        this.props.onDragStart(event, this.generateDragInformation(last));
                    }
                }
            }
        }
    });

    componentDidMount() {
        if (this.element !== null) {
            this.element.addEventListener('mousedown', this.handleDown);
            this.element.addEventListener('touchstart', this.handleDown);
        }
    }

    componentWillUnmount() {
        if (this.element !== null) {
            this.element.removeEventListener('mousedown', this.handleDown);
            this.element.removeEventListener('touchstart', this.handleDown);
            if (this.down) {
                this.down = false;
                if (this.props.onDragEnd) {
                    this.props.onDragEnd(undefined, this.generateDragInformation(this.current));
                }
                document.removeEventListener('mousemove', this.handleMove);
                document.removeEventListener('touchmove', this.handleMove);
                document.removeEventListener('mouseup', this.handleUp);
                document.removeEventListener('touchend', this.handleUp);
            }
        }
    }

    private getThreshold() {
        return this.props.threshold === undefined ? 0 : this.props.threshold;
    }

    private generateDragInformation(last: XY): DragInformation {
        return {
            current: this.current,
            start: this.start,
            last
        };
    }

    private handleDown = (event: MouseEvent | TouchEvent) => {
        if (!this.down && !this.dragging) {
            this.down = true;

            document.addEventListener('mousemove', this.handleMove);
            document.addEventListener('touchmove', this.handleMove);
            document.addEventListener('mouseup', this.handleUp);
            document.addEventListener('touchend', this.handleUp);
            this.current = this.start = getPosition(event);

            if (this.getThreshold() <= 0) {
                this.dragging = true;
                if (this.props.onDragStart) {
                    this.props.onDragStart(event, this.generateDragInformation(this.current));
                }
            }

            event.stopPropagation();
            event.preventDefault();
        }
    }

    private handleUp = (event: MouseEvent | TouchEvent) => {
        if (this.down) {
            this.down = false;

            document.removeEventListener('mousemove', this.handleMove);
            document.removeEventListener('touchmove', this.handleMove);
            document.removeEventListener('mouseup', this.handleUp);
            document.removeEventListener('touchend', this.handleUp);

            if (this.dragging) {
                this.dragging = false;
                const last = this.current;
                // If touch is released, there are no event coordinates
                // this.current = getPosition(event);
                if (this.props.onDragEnd) {
                    this.props.onDragEnd(event, this.generateDragInformation(last));
                }
            }
        }
    }

    render() {
        const { children, threshold, onDragStart, onDragMove, onDragEnd, ...other } = this.props;
        return <div ref={(ref) => this.element = ref} {...other}>
            {children}
        </div>;
    }
}
